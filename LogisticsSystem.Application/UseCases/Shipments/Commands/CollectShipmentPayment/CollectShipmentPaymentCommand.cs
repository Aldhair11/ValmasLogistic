using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Commands.CollectShipmentPayment;

public sealed record CollectShipmentPaymentCommand(Guid ShipmentId) : IRequest<ShipmentDto>;
