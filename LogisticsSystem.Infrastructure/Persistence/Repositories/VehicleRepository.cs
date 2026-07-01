using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogisticsSystem.Infrastructure.Persistence.Repositories;

public sealed class VehicleRepository : IVehicleRepository
{
    private const int MaxPageSize = 100;

    private readonly LogisticsDbContext _dbContext;

    public VehicleRepository(LogisticsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<(IReadOnlyList<Vehicle> Items, int TotalCount)> GetPageAsync(
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

        var query = _dbContext.Vehicles.AsNoTracking();

        if (activeOnly == true)
        {
            query = query.Where(v => v.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(v =>
                v.LicensePlate.ToLower().Contains(term) ||
                v.Model.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(v => v.LicensePlate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.Vehicles.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

    public Task<bool> ExistsLicensePlateAsync(
        string licensePlate,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = licensePlate.Trim();
        return _dbContext.Vehicles.AnyAsync(
            v => v.LicensePlate == normalized && (excludeId == null || v.Id != excludeId),
            cancellationToken);
    }

    public async Task AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default) =>
        await _dbContext.Vehicles.AddAsync(vehicle, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
