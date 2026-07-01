using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.CreateStaffUser;

public sealed record CreateStaffUserCommand(
    string Username,
    string Password,
    string Role,
    Guid? BranchId) : IRequest<StaffUserDto>;
