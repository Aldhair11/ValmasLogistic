using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogisticsSystem.Infrastructure.Persistence.Repositories;

public sealed class BranchRepository : IBranchRepository
{
    private const int MaxPageSize = 100;

    private readonly LogisticsDbContext _dbContext;

    public BranchRepository(LogisticsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<(IReadOnlyList<Branch> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        bool? activeOnly,
        CancellationToken cancellationToken = default)
    {
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize switch
        {
            < 1 => 10,
            > MaxPageSize => MaxPageSize,
            _ => pageSize,
        };

        var query = _dbContext.Branches.AsNoTracking();

        if (activeOnly == true)
        {
            query = query.Where(b => b.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(b =>
                b.Phone.ToLower().Contains(term) ||
                b.Name.ToLower().Contains(term) ||
                b.Address.ToLower().Contains(term) ||
                b.BusinessHours.ToLower().Contains(term) ||
                b.Country.ToLower().Contains(term) ||
                b.Department.ToLower().Contains(term) ||
                b.Province.ToLower().Contains(term) ||
                b.District.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(b => b.Name)
            .ThenBy(b => b.District)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Branch?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.Branches.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task AddAsync(Branch branch, CancellationToken cancellationToken = default) =>
        await _dbContext.Branches.AddAsync(branch, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
