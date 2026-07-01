using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.Enums;

namespace LogisticsSystem.Application.Interfaces;

public interface IShipmentRepositoryTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);

    Task RollbackAsync(CancellationToken cancellationToken = default);
}

public interface IShipmentRepository
{
    Task<IShipmentRepositoryTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default);

    Task<bool> DestinationBranchExistsAsync(
        Guid branchId,
        CancellationToken cancellationToken = default);

    Task AddAsync(Shipment shipment, CancellationToken cancellationToken = default);

    Task<Shipment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Shipment?> GetByIdForUserAsync(
        Guid id,
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default);

    Task<Shipment?> GetByTrackingNumberAsync(
        string trackingNumber,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Shipment> Items, int TotalCount)> GetPageAsync(
        ShipmentListFilter filter,
        CancellationToken cancellationToken = default);

    Task<CashSummaryDto> GetCashSummaryAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<ShipmentStatus, int>> GetCountByStatusAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default);

    Task<DateTime?> GetLastCreatedAtAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default);

    Task<int> GetCountCreatedSinceAsync(
        DateTime sinceUtc,
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
