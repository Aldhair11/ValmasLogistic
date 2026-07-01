using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.SetVehicleStatus;

public sealed class SetVehicleStatusCommandHandler
    : IRequestHandler<SetVehicleStatusCommand, VehicleDto>
{
    private readonly IVehicleRepository _vehicleRepository;

    public SetVehicleStatusCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<VehicleDto> Handle(
        SetVehicleStatusCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Vehicle not found.");

        if (request.IsActive)
        {
            vehicle.Activate();
        }
        else
        {
            vehicle.Deactivate();
        }

        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return VehicleDtoMapper.ToDto(vehicle);
    }
}
