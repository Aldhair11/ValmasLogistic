using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Queries.GetCouriersPage;

public record GetCouriersPageQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? IsAvailable = null,
    bool? ActiveOnly = null) : IRequest<PagedResult<CourierDto>>;
