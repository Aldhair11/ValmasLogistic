using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.UpdateShipmentStatus;

public sealed class UpdateShipmentStatusCommandHandler : IRequestHandler<UpdateShipmentStatusCommand>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly IShipmentNotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public UpdateShipmentStatusCommandHandler(
        IShipmentRepository shipmentRepository,
        IShipmentNotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _notificationService = notificationService
            ?? throw new ArgumentNullException(nameof(notificationService));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task Handle(UpdateShipmentStatusCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        var access = ShipmentTenancy.ResolveAccess(currentUser);

        var shipment = await _shipmentRepository.GetByIdForUserAsync(
            request.Id,
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);

        if (shipment is null)
        {
            throw new KeyNotFoundException($"Shipment with id '{request.Id}' was not found.");
        }

        if (request.NewStatus == ShipmentStatus.Delivered
            && shipment.PaymentMethod == PaymentMethod.CashOnDelivery
            && !shipment.IsPaid)
        {
            if (request.PaymentCollected != true)
            {
                throw new ArgumentException(
                    "Payment must be collected before delivering a cash-on-delivery shipment.",
                    nameof(request.PaymentCollected));
            }

            shipment.MarkAsPaid();
        }

        shipment.UpdateStatus(request.NewStatus, request.Pin);

        await _shipmentRepository.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyShipmentUpdatedAsync(shipment.Id, cancellationToken);
    }
}
