using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.UpdateVehicle;

public record UpdateVehicleCommand(
    Guid Id,
    string LicensePlate,
    string Model,
    decimal CapacityInKg) : IRequest<VehicleDto>;
