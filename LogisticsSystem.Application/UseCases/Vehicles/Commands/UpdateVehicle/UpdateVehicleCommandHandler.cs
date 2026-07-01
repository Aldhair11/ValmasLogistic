using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Exceptions;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.UpdateVehicle;

public sealed class UpdateVehicleCommandHandler
    : IRequestHandler<UpdateVehicleCommand, VehicleDto>
{
    private readonly IVehicleRepository _vehicleRepository;

    public UpdateVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<VehicleDto> Handle(
        UpdateVehicleCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Vehicle not found.");

        var licensePlate = request.LicensePlate.Trim();
        if (await _vehicleRepository.ExistsLicensePlateAsync(
                licensePlate,
                request.Id,
                cancellationToken))
        {
            throw new ConflictException("A vehicle with this license plate already exists.");
        }

        vehicle.Update(licensePlate, request.Model.Trim(), request.CapacityInKg);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return VehicleDtoMapper.ToDto(vehicle);
    }
}
