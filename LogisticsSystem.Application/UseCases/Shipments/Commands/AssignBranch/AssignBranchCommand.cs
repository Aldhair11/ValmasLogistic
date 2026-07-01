using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.AssignBranch;

public record AssignBranchCommand(Guid ShipmentId, Guid BranchId) : IRequest;
