namespace LogisticsSystem.Application.DTOs;

public record VehicleDto(
    Guid Id,
    string LicensePlate,
    string Model,
    decimal CapacityInKg,
    bool IsActive);
