using System.Security.Cryptography;

using LogisticsSystem.Domain.Enums;

using LogisticsSystem.Domain.ValueObjects;



namespace LogisticsSystem.Domain.Entities;



public class Shipment

{

    public Guid Id { get; private set; }

    public Address Origin { get; private set; }

    public Address Destination { get; private set; }

    public decimal WeightInKg { get; private set; }

    public PackageType Type { get; private set; }

    public PackageSize Size { get; private set; }

    public bool IsFragile { get; private set; }

    public string ContentDescription { get; private set; }

    public bool PickupRequired { get; private set; }

    public DeliveryType DeliveryType { get; private set; }

    public Guid? DestinationBranchId { get; private set; }

    public ShipmentStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public string TrackingNumber { get; private set; }

    public string DeliveryPin { get; private set; }

    public PaymentMethod PaymentMethod { get; private set; }

    public decimal ShippingAmount { get; private set; }

    public bool IsPaid { get; private set; }

    public DateTime? PaidAt { get; private set; }

    public Guid? SenderId { get; private set; }

    public Guid? RecipientId { get; private set; }

    public Guid? AssignedCourierId { get; private set; }

    public Guid? CurrentBranchId { get; private set; }

    public Customer? Sender { get; private set; }

    public Customer? Recipient { get; private set; }

    public Courier? AssignedCourier { get; private set; }

    public Branch? CurrentBranch { get; private set; }

    public Branch? DestinationBranch { get; private set; }



    private Shipment()

    {

        Origin = null!;

        Destination = null!;

        TrackingNumber = null!;

        DeliveryPin = null!;

        ContentDescription = null!;

    }



    private Shipment(

        Guid id,

        Address origin,

        Address destination,

        decimal weightInKg,

        PackageType type,

        PackageSize size,

        bool isFragile,

        string contentDescription,

        bool pickupRequired,

        DeliveryType deliveryType,

        Guid? destinationBranchId,

        ShipmentStatus status,

        DateTime createdAt,

        string trackingNumber,

        string deliveryPin,

        PaymentMethod paymentMethod,

        decimal shippingAmount,

        bool isPaid,

        DateTime? paidAt)

    {

        Id = id;

        Origin = origin;

        Destination = destination;

        WeightInKg = weightInKg;

        Type = type;

        Size = size;

        IsFragile = isFragile;

        ContentDescription = contentDescription;

        PickupRequired = pickupRequired;

        DeliveryType = deliveryType;

        DestinationBranchId = destinationBranchId;

        Status = status;

        CreatedAt = createdAt;

        TrackingNumber = trackingNumber;

        DeliveryPin = deliveryPin;

        PaymentMethod = paymentMethod;

        ShippingAmount = shippingAmount;

        IsPaid = isPaid;

        PaidAt = paidAt;

    }



    public static Shipment Create(

        Address origin,

        Address destination,

        decimal weight,

        string deliveryPin,

        PaymentMethod paymentMethod,

        decimal shippingAmount,

        PackageType type,

        PackageSize size,

        bool isFragile,

        string contentDescription,

        bool pickupRequired,

        DeliveryType deliveryType,

        Guid? currentBranchId = null,

        Guid? destinationBranchId = null)

    {

        ArgumentNullException.ThrowIfNull(origin);

        ArgumentNullException.ThrowIfNull(destination);



        if (weight <= 0m)

        {

            throw new ArgumentOutOfRangeException(

                nameof(weight),

                "Shipment weight must be greater than zero.");

        }



        ValidateDeliveryPin(deliveryPin);

        ValidatePackageType(type);

        ValidatePackageSize(size);

        ValidateDeliveryType(deliveryType);

        ArgumentException.ThrowIfNullOrWhiteSpace(contentDescription);



        if (deliveryType == DeliveryType.BranchPickup &&

            (destinationBranchId is null || destinationBranchId == Guid.Empty))

        {

            throw new ArgumentException(

                "Destination branch is required when delivery type is branch pickup.",

                nameof(destinationBranchId));

        }



        if (!Enum.IsDefined(paymentMethod))

        {

            throw new ArgumentOutOfRangeException(

                nameof(paymentMethod),

                $"Unknown payment method '{paymentMethod}'.");

        }



        if (shippingAmount < 0m)

        {

            throw new ArgumentOutOfRangeException(

                nameof(shippingAmount),

                "Shipping amount cannot be negative.");

        }



        var isPaid = paymentMethod == PaymentMethod.PrePaid;

        var paidAt = isPaid ? DateTime.UtcNow : (DateTime?)null;



        var hasBranch = currentBranchId is { } branchId && branchId != Guid.Empty;

        var initialStatus = hasBranch

            ? ShipmentStatus.Pending

            : ShipmentStatus.PendingValidation;



        var shipment = new Shipment(

            id: Guid.NewGuid(),

            origin: origin,

            destination: destination,

            weightInKg: weight,

            type: type,

            size: size,

            isFragile: isFragile,

            contentDescription: contentDescription.Trim(),

            pickupRequired: pickupRequired,

            deliveryType: deliveryType,

            destinationBranchId: destinationBranchId,

            status: initialStatus,

            createdAt: DateTime.UtcNow,

            trackingNumber: GenerateTrackingNumber(),

            deliveryPin: deliveryPin,

            paymentMethod: paymentMethod,

            shippingAmount: shippingAmount,

            isPaid: isPaid,

            paidAt: paidAt);



        if (hasBranch)

        {

            shipment.AssignToBranch(currentBranchId!.Value);

        }



        return shipment;

    }



    public void UpdateStatus(ShipmentStatus newStatus, string? providedPin = null)

    {

        if (Status == newStatus)

        {

            return;

        }



        if (Status is ShipmentStatus.Delivered or ShipmentStatus.Cancelled)

        {

            throw new InvalidOperationException(

                $"Cannot change status: the shipment is already in a terminal state ('{Status}').");

        }



        EnsureForwardTransition(Status, newStatus);



        if (newStatus == ShipmentStatus.Delivered)

        {

            if (string.IsNullOrWhiteSpace(providedPin) ||

                !string.Equals(providedPin, DeliveryPin, StringComparison.Ordinal))

            {

                throw new ArgumentException("Invalid Delivery PIN.", nameof(providedPin));

            }

        }



        Status = newStatus;

    }



    public void MarkAsPaid(DateTime? paidAtUtc = null)

    {

        if (IsPaid)

        {

            return;

        }



        IsPaid = true;

        PaidAt = paidAtUtc ?? DateTime.UtcNow;

    }



    public void AssignSender(Guid customerId)

    {

        if (customerId == Guid.Empty)

        {

            throw new ArgumentException("Sender id cannot be empty.", nameof(customerId));

        }



        SenderId = customerId;

    }



    public void AssignRecipient(Guid customerId)

    {

        if (customerId == Guid.Empty)

        {

            throw new ArgumentException("Recipient id cannot be empty.", nameof(customerId));

        }



        RecipientId = customerId;

    }



    public void AssignCourier(Guid courierId)

    {

        if (courierId == Guid.Empty)

        {

            throw new ArgumentException("Courier id cannot be empty.", nameof(courierId));

        }



        AssignedCourierId = courierId;

    }



    public void AssignToBranch(Guid branchId)

    {

        if (branchId == Guid.Empty)

        {

            throw new ArgumentException("Branch id cannot be empty.", nameof(branchId));

        }



        CurrentBranchId = branchId;

    }



    private static void EnsureForwardTransition(ShipmentStatus current, ShipmentStatus next)

    {

        if (next == ShipmentStatus.Cancelled) return;



        var allowed = current switch

        {

            ShipmentStatus.PendingValidation => next is ShipmentStatus.Pending or ShipmentStatus.Cancelled,

            ShipmentStatus.Pending => next == ShipmentStatus.InTransit,

            ShipmentStatus.InTransit => next == ShipmentStatus.Delivered,

            _ => false,

        };



        if (!allowed)

        {

            throw new InvalidOperationException(

                $"Cannot move status backwards (from '{current}' to '{next}').");

        }

    }



    private static void ValidatePackageType(PackageType type)

    {

        if (!Enum.IsDefined(type))

        {

            throw new ArgumentOutOfRangeException(

                nameof(type),

                $"Unknown package type '{type}'.");

        }

    }



    private static void ValidatePackageSize(PackageSize size)

    {

        if (!Enum.IsDefined(size))

        {

            throw new ArgumentOutOfRangeException(

                nameof(size),

                $"Unknown package size '{size}'.");

        }

    }



    private static void ValidateDeliveryType(DeliveryType deliveryType)

    {

        if (!Enum.IsDefined(deliveryType))

        {

            throw new ArgumentOutOfRangeException(

                nameof(deliveryType),

                $"Unknown delivery type '{deliveryType}'.");

        }

    }



    private static void ValidateDeliveryPin(string deliveryPin)

    {

        if (string.IsNullOrWhiteSpace(deliveryPin))

        {

            throw new ArgumentException(

                "Delivery PIN is required.",

                nameof(deliveryPin));

        }



        if (deliveryPin.Length != 4 || !deliveryPin.All(char.IsDigit))

        {

            throw new ArgumentException(

                "Delivery PIN must be exactly 4 numeric digits.",

                nameof(deliveryPin));

        }

    }



    private static string GenerateTrackingNumber()

    {

        const string allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        return RandomNumberGenerator.GetString(allowedChars, 10);

    }

}


