using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentsPage;

public record GetShipmentsPageQuery(
    int Page = 1,
    int PageSize = 10,
    ShipmentStatus? Status = null,
    string? Statuses = null,
    string? Search = null,
    PaymentMethod? PaymentMethod = null,
    bool? IsPaid = null,
    DateTime? CreatedFrom = null,
    DateTime? CreatedTo = null) : IRequest<PagedResult<ShipmentDto>>;
