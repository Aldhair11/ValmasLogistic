using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.UpdateCourier;

public record UpdateCourierCommand(
    Guid Id,
    string FullName,
    string Phone,
    bool IsAvailable,
    Guid? CurrentVehicleId = null) : IRequest<CourierDto>;
