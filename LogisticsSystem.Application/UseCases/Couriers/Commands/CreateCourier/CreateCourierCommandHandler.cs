using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Domain.Entities;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.CreateCourier;

public sealed class CreateCourierCommandHandler
    : IRequestHandler<CreateCourierCommand, CourierDto>
{
    private readonly ICourierRepository _courierRepository;
    private readonly IVehicleRepository _vehicleRepository;

    public CreateCourierCommandHandler(
        ICourierRepository courierRepository,
        IVehicleRepository vehicleRepository)
    {
        _courierRepository = courierRepository
            ?? throw new ArgumentNullException(nameof(courierRepository));
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<CourierDto> Handle(
        CreateCourierCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        await ValidateVehicleAssignmentAsync(request.CurrentVehicleId, cancellationToken);

        var courier = new Courier(
            Guid.NewGuid(),
            request.FullName.Trim(),
            request.Phone.Trim(),
            request.IsAvailable,
            request.CurrentVehicleId);

        await _courierRepository.AddAsync(courier, cancellationToken);
        await _courierRepository.SaveChangesAsync(cancellationToken);

        var created = await _courierRepository.GetByIdAsync(courier.Id, cancellationToken)
            ?? courier;

        return CourierDtoMapper.ToDto(created);
    }

    private async Task ValidateVehicleAssignmentAsync(
        Guid? vehicleId,
        CancellationToken cancellationToken)
    {
        if (vehicleId is null)
        {
            return;
        }

        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId.Value, cancellationToken)
            ?? throw new KeyNotFoundException("Assigned vehicle not found.");

        if (!vehicle.IsActive)
        {
            throw new InvalidOperationException("Cannot assign an inactive vehicle.");
        }
    }
}
