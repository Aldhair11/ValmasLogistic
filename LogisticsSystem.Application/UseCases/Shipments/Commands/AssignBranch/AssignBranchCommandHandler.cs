using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.AssignBranch;

public sealed class AssignBranchCommandHandler : IRequestHandler<AssignBranchCommand>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public AssignBranchCommandHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task Handle(AssignBranchCommand request, CancellationToken cancellationToken)
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

        shipment.AssignToBranch(request.BranchId);

        await _shipmentRepository.SaveChangesAsync(cancellationToken);
    }
}
