using LogisticsSystem.Application.Interfaces;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Auth.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, string?>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
        _jwtTokenService = jwtTokenService
            ?? throw new ArgumentNullException(nameof(jwtTokenService));
    }

    public async Task<string?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);

        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        return _jwtTokenService.GenerateToken(user.Username, user.Role);
    }
}
