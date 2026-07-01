using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.AssignCourier;

public record AssignCourierCommand(Guid ShipmentId, Guid CourierId) : IRequest;
