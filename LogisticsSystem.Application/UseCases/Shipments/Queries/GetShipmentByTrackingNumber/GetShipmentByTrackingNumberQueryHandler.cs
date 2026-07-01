using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentByTrackingNumber;

public sealed class GetShipmentByTrackingNumberQueryHandler
    : IRequestHandler<GetShipmentByTrackingNumberQuery, PublicShipmentDto?>
{
    private readonly IShipmentRepository _shipmentRepository;

    public GetShipmentByTrackingNumberQueryHandler(IShipmentRepository shipmentRepository)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
    }

    public async Task<PublicShipmentDto?> Handle(
        GetShipmentByTrackingNumberQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            return null;
        }

        var shipment = await _shipmentRepository.GetByTrackingNumberAsync(
            request.TrackingNumber.Trim(),
            cancellationToken);

        if (shipment is null) return null;

    
        return new PublicShipmentDto(
            TrackingNumber: shipment.TrackingNumber,
            OriginCity: shipment.Origin.City,
            DestinationCity: shipment.Destination.City,
            Status: shipment.Status.ToString(),
            WeightInKg: shipment.WeightInKg,
            CreatedAt: shipment.CreatedAt);
    }
}
