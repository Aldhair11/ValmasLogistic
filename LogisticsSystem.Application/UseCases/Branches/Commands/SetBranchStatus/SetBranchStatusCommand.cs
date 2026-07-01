using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Commands.SetBranchStatus;

public record SetBranchStatusCommand(Guid Id, bool IsActive) : IRequest<BranchDto>;
