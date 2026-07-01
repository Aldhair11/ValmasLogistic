using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.ValueObjects;

namespace LogisticsSystem.Application.Mapping;

internal static class ShipmentDtoMapper
{
    public static ShipmentDto ToDto(Shipment shipment)
    {
        ArgumentNullException.ThrowIfNull(shipment);

        return new ShipmentDto(
            Id: shipment.Id,
            Origin: MapAddress(shipment.Origin),
            Destination: MapAddress(shipment.Destination),
            WeightInKg: shipment.WeightInKg,
            Status: shipment.Status.ToString(),
            CreatedAt: shipment.CreatedAt,
            TrackingNumber: shipment.TrackingNumber,
            PaymentMethod: shipment.PaymentMethod.ToString(),
            ShippingAmount: shipment.ShippingAmount,
            IsPaid: shipment.IsPaid,
            PaidAt: shipment.PaidAt,
            Type: shipment.Type.ToString(),
            Size: shipment.Size.ToString(),
            IsFragile: shipment.IsFragile,
            ContentDescription: shipment.ContentDescription,
            PickupRequired: shipment.PickupRequired,
            DeliveryType: shipment.DeliveryType.ToString(),
            DestinationBranchId: shipment.DestinationBranchId,
            SenderId: shipment.SenderId,
            RecipientId: shipment.RecipientId,
            AssignedCourierId: shipment.AssignedCourierId,
            CurrentBranchId: shipment.CurrentBranchId,
            SenderName: shipment.Sender?.FullName,
            RecipientName: shipment.Recipient?.FullName,
            CourierName: shipment.AssignedCourier?.FullName,
            BranchName: shipment.CurrentBranch?.Name,
            DestinationBranchName: shipment.DestinationBranch?.Name);
    }

    private static AddressDto MapAddress(Address address)
    {
        return new AddressDto(address.Street, address.City, address.State, address.ZipCode);
    }
}
