using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Security;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NatureMiniPlex.Core.Application.Common;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Domain.Entities;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.API.Middlewares;

/// <summary>
/// HTTP Middleware สำหรับทำ Action Logging / Audit Trail แบบอัตโนมัติทั้งระบบ
/// ถ่ายทอดบริบท "Who, What, Where, When, How" และทำการ Redact PII (PDPA Compliant)
/// </summary>
public class ActionLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ActionLoggingMiddleware> _logger;

    public ActionLoggingMiddleware(RequestDelegate next, ILogger<ActionLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // ข้ามการบันทึก Log สำหรับ OPTIONS (CORS Preflight), Static Files, Swagger หรือ Health Check Endpoint
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
        if (context.Request.Method == "OPTIONS" || path.StartsWith("/swagger") || path.StartsWith("/favicon") || path.Contains("/health"))
        {
            await _next(context);
            return;
        }

        var startTime = DateTime.UtcNow;

        // 1. อ่านข้อมูล Request Context & Actor Details (Who & Where)
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var sessionId = context.TraceIdentifier; // Request Correlation ID
        var method = context.Request.Method;
        var requestPath = context.Request.Path;

        // อ่าน Payload ก่อนทำรายการ (Before State / Request Payload)
        string requestBody = string.Empty;
        context.Request.EnableBuffering();
        if (context.Request.ContentLength > 0 && context.Request.Body.CanRead)
        {
            using var reader = new StreamReader(
                context.Request.Body,
                Encoding.UTF8,
                leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0; // Reset Stream position
        }

        // เตรียม Capture Response Body
        var originalResponseBodyStream = context.Response.Body;
        using var responseBodyStream = new MemoryStream();
        context.Response.Body = responseBodyStream;

        Exception? caughtException = null;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            caughtException = ex;
            throw;
        }
        finally
        {
            // คืนค่า Response Body Stream กลับเป็น Original Stream เสมอเพื่อป้องกัน ObjectDisposedException
            context.Response.Body = originalResponseBodyStream;

            // อ่าน Response Body ที่บันทึกไว้ใน MemoryStream
            responseBodyStream.Position = 0;
            var responseBody = await new StreamReader(responseBodyStream).ReadToEndAsync();

            // คัดลอก Response Body กลับไปยัง Original Stream เฉพาะกรณีที่มีข้อมูลถูกเขียน
            if (responseBodyStream.Length > 0 && !context.Response.HasStarted)
            {
                responseBodyStream.Position = 0;
                await responseBodyStream.CopyToAsync(originalResponseBodyStream);
            }

            // 2. ประมวลผล Actor Info จาก Claims
            int? userId = null;
            string? actorEmail = null;
            string? actorRole = null;

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out var parsedId))
                {
                    userId = parsedId;
                }
                actorEmail = DataRedactor.MaskEmail(context.User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty);
                actorRole = context.User.FindFirst(ClaimTypes.Role)?.Value ?? "UNKNOWN";
            }

            // 3. กำหนด Action Name และ Target Type (What & Target)
            var actionName = ResolveActionName(method, requestPath);
            var (targetId, targetType) = ResolveTargetInfo(context, requestPath);

            // กรณี LOGIN_ATTEMPT สำหรับผู้ใช้ที่ยังไม่ได้ Authenticate: ดึง Username, UserId, Email, Role มาบันทึกใน ActionLog
            if (userId == null && actionName == "LOGIN_ATTEMPT" && !string.IsNullOrWhiteSpace(requestBody))
            {
                try
                {
                    using var doc = JsonDocument.Parse(requestBody);
                    if (doc.RootElement.TryGetProperty("username", out var usernameElem))
                    {
                        var attemptedUsername = usernameElem.GetString();
                        if (!string.IsNullOrWhiteSpace(attemptedUsername))
                        {
                            targetId = attemptedUsername;
                            targetType = "TABLE: users";

                            var dbContext = context.RequestServices.GetService<ApplicationDbContext>();
                            if (dbContext != null)
                            {
                                var targetUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == attemptedUsername);
                                if (targetUser != null)
                                {
                                    userId = targetUser.Id;
                                    if (!string.IsNullOrEmpty(targetUser.Email))
                                    {
                                        actorEmail = DataRedactor.MaskEmail(targetUser.Email);
                                    }

                                    var roleCode = await dbContext.UserRoles
                                        .Where(ur => ur.UserId == targetUser.Id)
                                        .Select(ur => ur.Role.Code)
                                        .FirstOrDefaultAsync();

                                    actorRole = roleCode ?? (targetUser.Username.Equals("admin", StringComparison.OrdinalIgnoreCase) ? "SYSTEM_ADMIN" : "CUSTOMER");
                                }
                            }
                        }
                    }
                }
                catch { }
            }

            // 4. ทำ Data Masking บน Payload ทั้ง Request (Before) และ Response (After) ตามมาตรฐาน PDPA
            var redactedRequestBody = DataRedactor.RedactJson(requestBody);
            var redactedResponseBody = DataRedactor.RedactJson(responseBody);

            // 5. ประเมิน HTTP Status Code และ Log Level อย่างแม่นยำ
            var statusCode = context.Response.StatusCode;
            if (caughtException != null)
            {
                statusCode = caughtException switch
                {
                    UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                    SecurityException => StatusCodes.Status403Forbidden,
                    FluentValidation.ValidationException => StatusCodes.Status400BadRequest,
                    KeyNotFoundException => StatusCodes.Status404NotFound,
                    NatureMiniPlex.Core.Domain.Exceptions.DomainException => StatusCodes.Status422UnprocessableEntity,
                    Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException => StatusCodes.Status409Conflict,
                    _ => StatusCodes.Status500InternalServerError
                };
            }

            var logLevel = statusCode switch
            {
                >= 200 and < 400 => "INFO",
                >= 400 and < 500 => "WARNING",
                _ => "ERROR"
            };

            // 6. สร้าง Standardized Detail JSON Structure { "before": ..., "after": ... }
            var detailStructure = new
            {
                before = string.IsNullOrWhiteSpace(redactedRequestBody) ? null : TryParseJson(redactedRequestBody),
                after = string.IsNullOrWhiteSpace(redactedResponseBody) ? null : TryParseJson(redactedResponseBody),
                errorDetails = caughtException?.Message
            };

            var detailJson = JsonSerializer.Serialize(detailStructure, new JsonSerializerOptions
            {
                WriteIndented = false
            });

            // 7. สร้าง ActionLog Object และบันทึกลง IActionLogRepository
            var actionLog = new ActionLog
            {
                LogLevel = logLevel,
                UserId = userId,
                ActorEmail = string.IsNullOrWhiteSpace(actorEmail) ? null : actorEmail,
                ActorRole = actorRole,
                IpAddress = ipAddress,
                ActionName = actionName,
                HttpMethod = method,
                TargetId = targetId,
                TargetType = targetType,
                DetailJson = detailJson,
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent,
                SessionId = sessionId,
                Location = requestPath,
                StatusCode = statusCode,
                Timestamp = startTime
            };

            try
            {
                var repo = context.RequestServices.GetService<IActionLogRepository>();
                if (repo != null)
                {
                    await repo.LogAsync(actionLog);
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Failed to persist ActionLog audit record into isolated database.");
            }
        }
    }

    private static string ResolveActionName(string method, string path)
    {
        var lowerPath = path.ToLowerInvariant();

        if (lowerPath.Contains("/auth/login")) return "LOGIN_ATTEMPT";
        if (lowerPath.Contains("/bookings") && method == "POST") return "CREATE_BOOKING";
        if (lowerPath.Contains("/bookings") && method == "DELETE") return "CANCEL_BOOKING";
        if (lowerPath.Contains("/users") && lowerPath.Contains("/roles")) return "UPDATE_USER_ROLES";
        if (lowerPath.Contains("/users") && method == "POST") return "CREATE_USER";
        if (lowerPath.Contains("/users") && method == "PUT") return "UPDATE_USER";
        if (lowerPath.Contains("/showtimes") && method == "POST") return "CREATE_SHOWTIME";

        return $"{method.ToUpperInvariant()}_{path.Replace('/', '_').Trim('_').ToUpperInvariant()}";
    }

    private static (string? TargetId, string? TargetType) ResolveTargetInfo(HttpContext context, string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length >= 2)
        {
            var entity = segments[1].ToLowerInvariant(); // e.g. bookings, users, movies, auth
            var targetType = $"TABLE: {entity}";
            string? targetId = null;

            if (segments.Length >= 3 && int.TryParse(segments[2], out _))
            {
                targetId = segments[2];
            }

            return (targetId, targetType);
        }

        return (null, "API_ENDPOINT");
    }

    private static object TryParseJson(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(json) ?? json;
        }
        catch
        {
            return json;
        }
    }
}
