using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Queries.GetBranchesPage;

public sealed class GetBranchesPageQueryHandler
    : IRequestHandler<GetBranchesPageQuery, PagedResult<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;

    public GetBranchesPageQueryHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository
            ?? throw new ArgumentNullException(nameof(branchRepository));
    }

    public async Task<PagedResult<BranchDto>> Handle(
        GetBranchesPageQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var (items, totalCount) = await _branchRepository.GetPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            request.ActiveOnly,
            cancellationToken);

        var dtos = items.Select(BranchDtoMapper.ToDto).ToList();
        var safePage = request.Page < 1 ? 1 : request.Page;
        var safePageSize = request.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => request.PageSize,
        };

        return new PagedResult<BranchDto>(dtos, totalCount, safePage, safePageSize);
    }
}
