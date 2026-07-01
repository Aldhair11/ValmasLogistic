using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Exceptions;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Domain.Entities;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Commands.CreateVehicle;

public sealed class CreateVehicleCommandHandler
    : IRequestHandler<CreateVehicleCommand, VehicleDto>
{
    private readonly IVehicleRepository _vehicleRepository;

    public CreateVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<VehicleDto> Handle(
        CreateVehicleCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var licensePlate = request.LicensePlate.Trim();
        if (await _vehicleRepository.ExistsLicensePlateAsync(licensePlate, cancellationToken: cancellationToken))
        {
            throw new ConflictException("A vehicle with this license plate already exists.");
        }

        var vehicle = new Vehicle(
            Guid.NewGuid(),
            licensePlate,
            request.Model.Trim(),
            request.CapacityInKg);

        await _vehicleRepository.AddAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return VehicleDtoMapper.ToDto(vehicle);
    }
}
