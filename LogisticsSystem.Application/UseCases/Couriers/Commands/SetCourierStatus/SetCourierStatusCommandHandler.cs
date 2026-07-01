using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.SetCourierStatus;

public sealed class SetCourierStatusCommandHandler
    : IRequestHandler<SetCourierStatusCommand, CourierDto>
{
    private readonly ICourierRepository _courierRepository;

    public SetCourierStatusCommandHandler(ICourierRepository courierRepository)
    {
        _courierRepository = courierRepository
            ?? throw new ArgumentNullException(nameof(courierRepository));
    }

    public async Task<CourierDto> Handle(
        SetCourierStatusCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var courier = await _courierRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Courier not found.");

        if (request.IsActive)
        {
            courier.Activate();
        }
        else
        {
            courier.Deactivate();
        }

        await _courierRepository.SaveChangesAsync(cancellationToken);

        var updated = await _courierRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? courier;

        return CourierDtoMapper.ToDto(updated);
    }
}
