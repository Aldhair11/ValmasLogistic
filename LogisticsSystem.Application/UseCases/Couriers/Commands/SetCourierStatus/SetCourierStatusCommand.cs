using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.SetCourierStatus;

public record SetCourierStatusCommand(Guid Id, bool IsActive) : IRequest<CourierDto>;
