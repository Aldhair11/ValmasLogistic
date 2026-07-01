namespace LogisticsSystem.Application.Interfaces;

public sealed record CurrentUserContext(
    Guid UserId,
    string Username,
    string Role,
    Guid? CustomerProfileId,
    Guid? BranchId);

public interface ICurrentUserService
{
    Task<CurrentUserContext?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
