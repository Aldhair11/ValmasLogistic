using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentByTrackingNumber;

public record GetShipmentByTrackingNumberQuery(string TrackingNumber)
    : IRequest<PublicShipmentDto?>;
