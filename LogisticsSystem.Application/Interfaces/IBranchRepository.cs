using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Interfaces;

public interface IBranchRepository
{
    Task<(IReadOnlyList<Branch> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        bool? activeOnly,
        CancellationToken cancellationToken = default);

    Task<Branch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Branch branch, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
