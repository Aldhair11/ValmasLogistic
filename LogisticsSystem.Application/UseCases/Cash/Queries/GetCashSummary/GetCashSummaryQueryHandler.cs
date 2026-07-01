using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Security;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Cash.Queries.GetCashSummary;

public sealed class GetCashSummaryQueryHandler
    : IRequestHandler<GetCashSummaryQuery, CashSummaryDto>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCashSummaryQueryHandler(
        IShipmentRepository shipmentRepository,
        ICurrentUserService currentUserService)
    {
        _shipmentRepository = shipmentRepository
            ?? throw new ArgumentNullException(nameof(shipmentRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<CashSummaryDto> Handle(
        GetCashSummaryQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        if (currentUser.Role == Domain.Constants.UserRoles.Client)
        {
            throw new UnauthorizedAccessException("Cash summary is not available for client users.");
        }

        var access = ShipmentTenancy.ResolveAccess(currentUser);

        return await _shipmentRepository.GetCashSummaryAsync(
            access.ClientCustomerProfileId,
            access.WorkerBranchId,
            cancellationToken);
    }
}
