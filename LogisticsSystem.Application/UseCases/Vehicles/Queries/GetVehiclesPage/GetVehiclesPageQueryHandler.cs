using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Vehicles.Queries.GetVehiclesPage;

public sealed class GetVehiclesPageQueryHandler
    : IRequestHandler<GetVehiclesPageQuery, PagedResult<VehicleDto>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public GetVehiclesPageQueryHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository
            ?? throw new ArgumentNullException(nameof(vehicleRepository));
    }

    public async Task<PagedResult<VehicleDto>> Handle(
        GetVehiclesPageQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var (items, totalCount) = await _vehicleRepository.GetPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.ActiveOnly,
            cancellationToken);

        var dtos = items.Select(VehicleDtoMapper.ToDto).ToList();
        var safePage = request.Page < 1 ? 1 : request.Page;
        var safePageSize = request.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => request.PageSize,
        };

        return new PagedResult<VehicleDto>(dtos, totalCount, safePage, safePageSize);
    }
}
