using LogisticsSystem.Domain.Enums;

namespace LogisticsSystem.Application.DTOs;

public record CreateShipmentRequestDto(
    AddressDto Origin,
    AddressDto Destination,
    decimal WeightInKg,
    string Pin,
    PaymentMethod PaymentMethod,
    PackageType Type,
    PackageSize Size,
    bool IsFragile,
    string ContentDescription,
    bool PickupRequired,
    DeliveryType DeliveryType,
    Guid? SenderId = null,
    Guid? RecipientId = null,
    Guid? CurrentBranchId = null,
    Guid? DestinationBranchId = null,
    decimal ShippingAmount = 0);
