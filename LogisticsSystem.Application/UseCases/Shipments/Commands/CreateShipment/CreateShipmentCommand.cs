using LogisticsSystem.Application.DTOs;

using LogisticsSystem.Domain.Enums;

using MediatR;



namespace LogisticsSystem.Application.UseCases.Shipments.Commands.CreateShipment;



public record CreateShipmentCommand(

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

    decimal ShippingAmount = 0) : IRequest<ShipmentReceiptDto>;


