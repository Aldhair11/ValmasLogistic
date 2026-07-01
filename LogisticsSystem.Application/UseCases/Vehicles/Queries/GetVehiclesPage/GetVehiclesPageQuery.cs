using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Queries.GetVehiclesPage;

public record GetVehiclesPageQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? ActiveOnly = null) : IRequest<PagedResult<VehicleDto>>;
