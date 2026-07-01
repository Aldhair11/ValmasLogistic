using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.UpdateShipmentStatus;

public record UpdateShipmentStatusCommand(
    Guid Id,
    ShipmentStatus NewStatus,
    string? Pin = null,
    bool? PaymentCollected = null) : IRequest;
