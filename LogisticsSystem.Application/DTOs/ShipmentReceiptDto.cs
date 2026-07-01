namespace LogisticsSystem.Application.DTOs;


public record ShipmentReceiptDto(
    Guid Id,
    AddressDto Origin,
    AddressDto Destination,
    decimal WeightInKg,
    string Status,
    DateTime CreatedAt,
    string TrackingNumber,
    string DeliveryPin,
    string PaymentMethod,
    decimal ShippingAmount,
    bool IsPaid,
    DateTime? PaidAt);
