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
        var title = "An internal server error occurred.";
        var detail = exception.Message;

        if (exception is ValidationException validationException)
        {
            statusCode = StatusCodes.Status400BadRequest;
            title = "Validation Error";
            detail = string.Join("; ", validationException.Errors);
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            statusCode = StatusCodes.Status409Conflict;
            title = "Concurrency Conflict";
            detail = "The record you attempted to edit was modified by another user after you got the original value.";
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateException dbUpdateEx)
        {
            statusCode = StatusCodes.Status409Conflict;
            title = "Database Conflict";
            detail = "A conflict occurred with the database. The record might already exist or has been modified.";
            // If inner exception contains unique index violation, it's likely a double booking
            if (dbUpdateEx.InnerException != null && dbUpdateEx.InnerException.Message.Contains("IX_BookingItem_Showtime_Seat_Active"))
            {
                detail = "One or more of the selected seats have already been booked by someone else.";
            }
        }
        else if (exception is Exception) // Handle generic exceptions from Use Cases as bad request for MVP
        {
            statusCode = StatusCodes.Status400BadRequest;
            title = "Bad Request";
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
