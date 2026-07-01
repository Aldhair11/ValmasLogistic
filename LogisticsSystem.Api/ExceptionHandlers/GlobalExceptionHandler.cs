using LogisticsSystem.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsSystem.Api.ExceptionHandlers;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IHostEnvironment environment)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problem = MapException(exception);

        if (problem is null)
        {
            _logger.LogError(exception, "Unhandled exception while processing {Path}", httpContext.Request.Path);
            return false;
        }

        _logger.LogWarning(
            exception,
            "Handled domain/application exception ({StatusCode}) while processing {Path}: {Message}",
            problem.Status,
            httpContext.Request.Path,
            exception.Message);

        httpContext.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;

        await httpContext.Response
            .WriteAsJsonAsync(problem, cancellationToken: cancellationToken);

        return true;
    }

    private ProblemDetails? MapException(Exception exception) => exception switch
    {
        InvalidOperationException invalidOp => Build(
            status: StatusCodes.Status400BadRequest,
            title: "Business rule violation",
            detail: invalidOp.Message),

        KeyNotFoundException notFound => Build(
            status: StatusCodes.Status404NotFound,
            title: "Resource not found",
            detail: notFound.Message),

        ArgumentException argument => Build(
            status: StatusCodes.Status400BadRequest,
            title: "Invalid request",
            detail: argument.Message),

        UnauthorizedAccessException unauthorized => Build(
            status: StatusCodes.Status403Forbidden,
            title: "Forbidden",
            detail: unauthorized.Message),

        ConflictException conflict => Build(
            status: StatusCodes.Status409Conflict,
            title: "Conflict",
            detail: conflict.Message),

        _ => null,
    };

    private ProblemDetails Build(int status, string title, string detail)
    {
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
        };

        if (_environment.IsDevelopment())
        {
            problem.Extensions["environment"] = _environment.EnvironmentName;
        }

        return problem;
    }
}
