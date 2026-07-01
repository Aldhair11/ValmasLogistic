namespace LogisticsSystem.Application.DTOs;

public record ShipmentMetricsDto(
    int TotalShipments,
    int Pending,
    int InTransit,
    int Delivered,
    int Cancelled,
    DateTime? LastUpdatedAt,
    int NewShipmentsToday);
