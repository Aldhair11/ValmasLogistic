using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Application.Security;
using LogisticsSystem.Domain.Enums;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentsPage;

public sealed class GetShipmentsPageQueryHandler
    : IRequestHandler<GetShipmentsPageQuery, PagedResult<ShipmentDto>>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetShipmentsPageQueryHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<PagedResult<ShipmentDto>> Handle(
        GetShipmentsPageQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        var access = ShipmentTenancy.ResolveAccess(currentUser);

        var (items, totalCount) = await _shipmentRepository.GetPageAsync(
            new ShipmentListFilter(
                Page: request.Page,
                PageSize: request.PageSize,
                Status: request.Status,
                Statuses: ParseStatuses(request.Statuses),
                Search: request.Search,
                PaymentMethod: request.PaymentMethod,
                IsPaid: request.IsPaid,
                CreatedFrom: request.CreatedFrom,
                CreatedTo: request.CreatedTo,
                ClientCustomerProfileId: access.ClientCustomerProfileId,
                WorkerBranchId: access.WorkerBranchId),
            cancellationToken);

        var dtos = items.Select(ShipmentDtoMapper.ToDto).ToList();

        return new PagedResult<ShipmentDto>(
            Items: dtos,
            TotalCount: totalCount,
            Page: request.Page < 1 ? 1 : request.Page,
            PageSize: request.PageSize < 1 ? 10 : request.PageSize);
    }

    private static IReadOnlyList<ShipmentStatus>? ParseStatuses(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var parsed = raw
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<ShipmentStatus>(value, true, out var status)
                ? status
                : (ShipmentStatus?)null)
            .Where(status => status.HasValue)
            .Select(status => status!.Value)
            .Distinct()
            .ToList();

        return parsed.Count == 0 ? null : parsed;
    }
}
