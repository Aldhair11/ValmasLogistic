using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogisticsSystem.Infrastructure.Persistence.Repositories;

public sealed class CourierRepository : ICourierRepository
{
    private const int MaxPageSize = 100;

    private readonly LogisticsDbContext _dbContext;

    public CourierRepository(LogisticsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<(IReadOnlyList<Courier> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        bool? isAvailable,
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

        var query = _dbContext.Couriers
            .AsNoTracking()
            .Include(c => c.CurrentVehicle)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(c => c.IsActive);
        }

        if (isAvailable.HasValue)
        {
            query = query.Where(c => c.IsAvailable == isAvailable.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.FullName.ToLower().Contains(term) ||
                c.Phone.ToLower().Contains(term) ||
                (c.CurrentVehicle != null && c.CurrentVehicle.LicensePlate.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.FullName)
            .ThenBy(c => c.Phone)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Courier?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.Couriers
            .Include(c => c.CurrentVehicle)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task AddAsync(Courier courier, CancellationToken cancellationToken = default) =>
        await _dbContext.Couriers.AddAsync(courier, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
