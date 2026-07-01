namespace LogisticsSystem.Application.DTOs;



public record ShipmentDto(

    Guid Id,

    AddressDto Origin,

    AddressDto Destination,

    decimal WeightInKg,

    string Status,

    DateTime CreatedAt,

    string TrackingNumber,

    string PaymentMethod,

    decimal ShippingAmount,

    bool IsPaid,

    DateTime? PaidAt,

    string Type,

    string Size,

    bool IsFragile,

    string ContentDescription,

    bool PickupRequired,

    string DeliveryType,

    Guid? DestinationBranchId,

    Guid? SenderId,

    Guid? RecipientId,

    Guid? AssignedCourierId,

    Guid? CurrentBranchId,

    string? SenderName,

    string? RecipientName,

    string? CourierName,

    string? BranchName,

    string? DestinationBranchName);


