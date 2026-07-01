using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Mapping;

public static class CourierDtoMapper
{
    public static CourierDto ToDto(Courier courier) =>
        new(
            courier.Id,
            courier.FullName,
            courier.Phone,
            courier.IsAvailable,
            courier.IsActive,
            courier.CurrentVehicleId,
            courier.CurrentVehicle is null
                ? null
                : VehicleDtoMapper.ToDto(courier.CurrentVehicle));
}
