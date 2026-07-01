using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Commands.CreateCourier;

public record CreateCourierCommand(
    string FullName,
    string Phone,
    bool IsAvailable,
    Guid? CurrentVehicleId = null) : IRequest<CourierDto>;
