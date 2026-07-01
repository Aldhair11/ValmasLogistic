namespace LogisticsSystem.Application.DTOs;


public record PublicShipmentDto(
    string TrackingNumber,
    string OriginCity,
    string DestinationCity,
    string Status,
    decimal WeightInKg,
    DateTime CreatedAt);
