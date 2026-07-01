using MediatR;

namespace LogisticsSystem.Application.UseCases.Auth.Login;

public record LoginCommand(string Username, string Password) : IRequest<string?>;
