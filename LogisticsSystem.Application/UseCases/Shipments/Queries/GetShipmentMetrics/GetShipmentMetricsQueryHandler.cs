using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentMetrics;

public sealed class GetShipmentMetricsQueryHandler
    : IRequestHandler<GetShipmentMetricsQuery, ShipmentMetricsDto>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetShipmentMetricsQueryHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<ShipmentMetricsDto> Handle(
        GetShipmentMetricsQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        var access = ShipmentTenancy.ResolveAccess(currentUser);

        var countsTask = _shipmentRepository.GetCountByStatusAsync(
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);
        var lastCreatedTask = _shipmentRepository.GetLastCreatedAtAsync(
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);
        var since = DateTime.UtcNow.AddHours(-24);
        var newTodayTask = _shipmentRepository.GetCountCreatedSinceAsync(
            since,
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);

        await Task.WhenAll(countsTask, lastCreatedTask, newTodayTask);

        var counts = countsTask.Result;
        var pendingOnly = counts.GetValueOrDefault(ShipmentStatus.Pending);
        var pendingValidation = counts.GetValueOrDefault(ShipmentStatus.PendingValidation);
        var pending = pendingOnly + pendingValidation;
        var inTransit = counts.GetValueOrDefault(ShipmentStatus.InTransit);
        var delivered = counts.GetValueOrDefault(ShipmentStatus.Delivered);
        var cancelled = counts.GetValueOrDefault(ShipmentStatus.Cancelled);

        return new ShipmentMetricsDto(
            TotalShipments: pendingOnly + pendingValidation + inTransit + delivered + cancelled,
            Pending: pending,
            InTransit: inTransit,
            Delivered: delivered,
            Cancelled: cancelled,
            LastUpdatedAt: lastCreatedTask.Result,
            NewShipmentsToday: newTodayTask.Result);
    }
}
