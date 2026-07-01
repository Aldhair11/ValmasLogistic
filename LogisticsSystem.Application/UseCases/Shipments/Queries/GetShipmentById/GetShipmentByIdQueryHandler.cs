using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Application.Security;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentById;

public sealed class GetShipmentByIdQueryHandler : IRequestHandler<GetShipmentByIdQuery, ShipmentDto?>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetShipmentByIdQueryHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<ShipmentDto?> Handle(
        GetShipmentByIdQuery request,
        CancellationToken cancellationToken)
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

        return shipment is null ? null : ShipmentDtoMapper.ToDto(shipment);
    }
}
