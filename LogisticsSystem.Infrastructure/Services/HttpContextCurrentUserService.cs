using System.Security.Claims;
using LogisticsSystem.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace LogisticsSystem.Infrastructure.Services;

public sealed class HttpContextCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserRepository _userRepository;

    public HttpContextCurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        IUserRepository userRepository)
    {
        _httpContextAccessor = httpContextAccessor
            ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public async Task<CurrentUserContext?> GetCurrentUserAsync(
        CancellationToken cancellationToken = default)
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var username = principal.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var role = principal.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken);

        return new CurrentUserContext(
            UserId: user?.Id ?? Guid.Empty,
            Username: username,
            Role: role,
            CustomerProfileId: user?.CustomerProfileId,
            BranchId: user?.BranchId);
    }
}
