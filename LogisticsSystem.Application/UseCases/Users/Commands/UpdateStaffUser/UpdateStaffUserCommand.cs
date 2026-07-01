using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.UpdateStaffUser;

public sealed record UpdateStaffUserCommand(
    Guid Id,
    string Username,
    string Role,
    Guid? BranchId,
    string? Password) : IRequest<StaffUserDto>;
