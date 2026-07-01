using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.UpdateCourier;

public sealed class UpdateCourierCommandHandler
    : IRequestHandler<UpdateCourierCommand, CourierDto>
{
    private readonly ICourierRepository _courierRepository;
    private readonly IVehicleRepository _vehicleRepository;

    public UpdateCourierCommandHandler(
        ICourierRepository courierRepository,
        IVehicleRepository vehicleRepository)
    {
        _courierRepository = courierRepository
            ?? throw new ArgumentNullException(nameof(courierRepository));
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<CourierDto> Handle(
        UpdateCourierCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var courier = await _courierRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Courier not found.");

        await ValidateVehicleAssignmentAsync(request.CurrentVehicleId, cancellationToken);

        courier.Update(
            request.FullName.Trim(),
            request.Phone.Trim(),
            request.IsAvailable,
            request.CurrentVehicleId);

        await _courierRepository.SaveChangesAsync(cancellationToken);

        var updated = await _courierRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? courier;

        return CourierDtoMapper.ToDto(updated);
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
