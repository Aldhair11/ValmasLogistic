using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Interfaces;

public interface ICourierRepository
{
    Task<(IReadOnlyList<Courier> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        bool? isAvailable,
        bool? activeOnly,
        CancellationToken cancellationToken = default);

    Task<Courier?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Courier courier, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
