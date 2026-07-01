using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Mapping;

public static class VehicleDtoMapper
{
    public static VehicleDto ToDto(Vehicle vehicle) =>
        new(
            vehicle.Id,
            vehicle.LicensePlate,
            vehicle.Model,
            vehicle.CapacityInKg,
            vehicle.IsActive);
}
