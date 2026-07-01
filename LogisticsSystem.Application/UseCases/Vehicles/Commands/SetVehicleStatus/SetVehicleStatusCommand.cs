using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.SetVehicleStatus;

public record SetVehicleStatusCommand(Guid Id, bool IsActive) : IRequest<VehicleDto>;
