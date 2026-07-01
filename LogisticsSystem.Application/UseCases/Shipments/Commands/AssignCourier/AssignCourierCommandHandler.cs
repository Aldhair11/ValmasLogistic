using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.AssignCourier;

public sealed class AssignCourierCommandHandler : IRequestHandler<AssignCourierCommand>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public AssignCourierCommandHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task Handle(AssignCourierCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

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

        shipment.AssignCourier(request.CourierId);

        await _shipmentRepository.SaveChangesAsync(cancellationToken);
    }
}
