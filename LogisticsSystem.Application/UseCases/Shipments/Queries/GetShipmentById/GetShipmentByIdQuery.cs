using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentById;

public record GetShipmentByIdQuery(Guid Id) : IRequest<ShipmentDto?>;
