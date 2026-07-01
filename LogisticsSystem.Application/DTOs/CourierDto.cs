namespace LogisticsSystem.Application.DTOs;

public record CourierDto(
    Guid Id,
    string FullName,
    string Phone,
    bool IsAvailable,
    bool IsActive,
    Guid? CurrentVehicleId,
    VehicleDto? CurrentVehicle);
