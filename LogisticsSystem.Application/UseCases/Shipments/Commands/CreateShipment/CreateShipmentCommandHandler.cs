using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.Enums;
using LogisticsSystem.Domain.ValueObjects;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.CreateShipment;

public sealed class CreateShipmentCommandHandler : IRequestHandler<CreateShipmentCommand, ShipmentReceiptDto>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;

    public CreateShipmentCommandHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService,
        IUserRepository userRepository)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public async Task<ShipmentReceiptDto> Handle(
        CreateShipmentCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        if (request.DeliveryType == DeliveryType.BranchPickup && request.DestinationBranchId is null)
        {
            throw new ArgumentException(
                "DestinationBranchId is required when DeliveryType is BranchPickup.",
                nameof(request.DestinationBranchId));
        }

        var senderId = await ResolveSenderIdAsync(request, currentUser, cancellationToken);
        var currentBranchId = ResolveCurrentBranchId(request, currentUser);

        var origin = MapToAddress(request.Origin);
        var destination = MapToAddress(request.Destination);

        if (request.ShippingAmount <= 0m)
        {
            throw new ArgumentException(
                "ShippingAmount must be greater than zero.",
                nameof(request.ShippingAmount));
        }

        var shipment = Shipment.Create(
            origin,
            destination,
            request.WeightInKg,
            request.Pin,
            request.PaymentMethod,
            request.ShippingAmount,
            request.Type,
            request.Size,
            request.IsFragile,
            request.ContentDescription,
            request.PickupRequired,
            request.DeliveryType,
            currentBranchId,
            request.DestinationBranchId);

        shipment.AssignSender(senderId);

        if (request.RecipientId is { } recipientId)
        {
            shipment.AssignRecipient(recipientId);
        }

        await using var transaction = await _shipmentRepository.BeginTransactionAsync(cancellationToken);

        try
        {
            if (request.DeliveryType == DeliveryType.BranchPickup)
            {
                var branchExists = await _shipmentRepository.DestinationBranchExistsAsync(
                    request.DestinationBranchId!.Value,
                    cancellationToken);

                if (!branchExists)
                {
                    throw new InvalidOperationException(
                        $"Destination branch '{request.DestinationBranchId}' was not found.");
                }
            }

            await _shipmentRepository.AddAsync(shipment, cancellationToken);
            await _shipmentRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return new ShipmentReceiptDto(
            Id: shipment.Id,
            Origin: request.Origin,
            Destination: request.Destination,
            WeightInKg: shipment.WeightInKg,
            Status: shipment.Status.ToString(),
            CreatedAt: shipment.CreatedAt,
            TrackingNumber: shipment.TrackingNumber,
            DeliveryPin: shipment.DeliveryPin,
            PaymentMethod: shipment.PaymentMethod.ToString(),
            ShippingAmount: shipment.ShippingAmount,
            IsPaid: shipment.IsPaid,
            PaidAt: shipment.PaidAt);
    }

    private async Task<Guid> ResolveSenderIdAsync(
        CreateShipmentCommand request,
        CurrentUserContext currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Role == UserRoles.Client)
        {
            if (currentUser.UserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException(
                    "Authenticated client user id is required.");
            }

            var userProfileId = await _userRepository.GetCustomerProfileIdAsync(
                currentUser.UserId,
                cancellationToken);

            if (userProfileId is null || userProfileId == Guid.Empty)
            {
                throw new UnauthorizedAccessException(
                    "El cliente no tiene un perfil asociado.");
            }

            return userProfileId.Value;
        }

        if (UserRoles.IsStaffRole(currentUser.Role))
        {
            if (request.SenderId is null || request.SenderId == Guid.Empty)
            {
                throw new ArgumentException(
                    "SenderId is required when creating a shipment as staff.",
                    nameof(request.SenderId));
            }

            return request.SenderId.Value;
        }

        throw new UnauthorizedAccessException(
            $"Role '{currentUser.Role}' is not authorized to create shipments.");
    }

    private static Guid? ResolveCurrentBranchId(
        CreateShipmentCommand request,
        CurrentUserContext currentUser)
    {
        if (currentUser.Role == UserRoles.Worker)
        {
            var workerBranchId = ShipmentTenancy.ResolveWorkerBranchId(currentUser);
            return request.CurrentBranchId ?? workerBranchId;
        }

        return request.CurrentBranchId;
    }

    private static Address MapToAddress(AddressDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new Address(dto.Street, dto.City, dto.State, dto.ZipCode);
    }
}
