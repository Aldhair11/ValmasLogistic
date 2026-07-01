using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Interfaces;

public interface IVehicleRepository
{
    Task<(IReadOnlyList<Vehicle> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        bool? activeOnly,
        CancellationToken cancellationToken = default);

    Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsLicensePlateAsync(
        string licensePlate,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
