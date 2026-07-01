using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.CreateVehicle;

public record CreateVehicleCommand(
    string LicensePlate,
    string Model,
    decimal CapacityInKg) : IRequest<VehicleDto>;
