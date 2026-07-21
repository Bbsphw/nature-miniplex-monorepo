using Microsoft.AspNetCore.Http;
using System;
using System.Text.Json;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace NatureMiniPlex.API.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        
        var statusCode = StatusCodes.Status500InternalServerError;
        var title = "เกิดข้อผิดพลาดภายในระบบ";
        var detail = exception.Message;

        if (exception is ValidationException validationException)
        {
            statusCode = StatusCodes.Status400BadRequest;
            title = "ข้อมูลไม่ถูกต้องตามเงื่อนไข";
            detail = string.Join("; ", validationException.Errors);
        }
        else if (exception is NatureMiniPlex.Core.Domain.Exceptions.DomainException domainException)
        {
            statusCode = StatusCodes.Status422UnprocessableEntity;
            title = "ผิดเงื่อนไขทางธุรกิจ";
            detail = domainException.Message;
        }
        else if (exception is KeyNotFoundException notFoundException)
        {
            statusCode = StatusCodes.Status404NotFound;
            title = "ไม่พบข้อมูล";
            detail = notFoundException.Message;
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            statusCode = StatusCodes.Status409Conflict;
            title = "เกิดข้อขัดแย้งในการทำรายการ";
            detail = "ข้อมูลที่คุณพยายามทำรายการถูกแก้ไขโดยผู้อื่น กรุณารีเฟรชเพื่อเลือกใหม่";
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateException dbUpdateEx)
        {
            statusCode = StatusCodes.Status409Conflict;
            title = "เกิดข้อขัดแย้งในฐานข้อมูล";
            detail = "เกิดข้อขัดแย้งในฐานข้อมูล ข้อมูลนี้อาจถูกจองหรือแก้ไขไปแล้ว";
            if (dbUpdateEx.InnerException != null && dbUpdateEx.InnerException.Message.Contains("IX_BookingItem_Showtime_Seat_Active"))
            {
                detail = "ที่นั่งบางรายการที่ท่านเลือกถูกจองไปแล้วโดยลูกค้ารายอื่น";
            }
        }
        else
        {
            statusCode = StatusCodes.Status500InternalServerError;
            title = "เกิดข้อผิดพลาดภายในระบบ";
            detail = exception.Message;
        }

        context.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = $"https://httpstatuses.com/{statusCode}",
            Instance = context.Request.Path
        };

        var result = JsonSerializer.Serialize(problemDetails);
        return context.Response.WriteAsync(result);
    }
}
