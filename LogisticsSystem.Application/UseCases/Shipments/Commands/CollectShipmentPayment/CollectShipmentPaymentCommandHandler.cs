using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Application.Security;
using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.CollectShipmentPayment;

public sealed class CollectShipmentPaymentCommandHandler
    : IRequestHandler<CollectShipmentPaymentCommand, ShipmentDto>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public CollectShipmentPaymentCommandHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<ShipmentDto> Handle(
        CollectShipmentPaymentCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        if (currentUser.Role == Domain.Constants.UserRoles.Client)
        {
            throw new UnauthorizedAccessException("Clients cannot collect payments.");
        }

        var access = ShipmentTenancy.ResolveAccess(currentUser);

        var shipment = await _shipmentRepository.GetByIdForUserAsync(
            request.ShipmentId,
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);

        if (shipment is null)
        {
            throw new KeyNotFoundException($"Shipment with id '{request.ShipmentId}' was not found.");
        }

        if (shipment.Status == ShipmentStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot collect payment for a cancelled shipment.");
        }

        if (shipment.IsPaid)
        {
            throw new InvalidOperationException("Shipment payment has already been collected.");
        }

        shipment.MarkAsPaid();

        await _shipmentRepository.SaveChangesAsync(cancellationToken);

        var updated = await _shipmentRepository.GetByIdAsync(shipment.Id, cancellationToken)
            ?? shipment;

        return ShipmentDtoMapper.ToDto(updated);
    }
}
