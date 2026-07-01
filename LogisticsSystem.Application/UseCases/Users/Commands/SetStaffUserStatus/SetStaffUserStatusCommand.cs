using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.SetStaffUserStatus;

public sealed record SetStaffUserStatusCommand(Guid Id, bool IsActive) : IRequest<StaffUserDto>;
