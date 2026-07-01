using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Commands.UpdateBranch;

public record UpdateBranchCommand(
    Guid Id,
    string Phone,
    string Name,
    string Address,
    string BusinessHours,
    string Country,
    string Department,
    string Province,
    string District) : IRequest<BranchDto>;
