using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentMetrics;

public record GetShipmentMetricsQuery() : IRequest<ShipmentMetricsDto>;
