using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Couriers.Queries.GetCouriersPage;

public sealed class GetCouriersPageQueryHandler
    : IRequestHandler<GetCouriersPageQuery, PagedResult<CourierDto>>
{
    private readonly ICourierRepository _courierRepository;

    public GetCouriersPageQueryHandler(ICourierRepository courierRepository)
    {
        _courierRepository = courierRepository
            ?? throw new ArgumentNullException(nameof(courierRepository));
    }

    public async Task<PagedResult<CourierDto>> Handle(
        GetCouriersPageQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var (items, totalCount) = await _courierRepository.GetPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.IsAvailable,
            request.ActiveOnly,
            cancellationToken);

        var dtos = items.Select(CourierDtoMapper.ToDto).ToList();
        var safePage = request.Page < 1 ? 1 : request.Page;
        var safePageSize = request.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => request.PageSize,
        };

        return new PagedResult<CourierDto>(dtos, totalCount, safePage, safePageSize);
    }
}
