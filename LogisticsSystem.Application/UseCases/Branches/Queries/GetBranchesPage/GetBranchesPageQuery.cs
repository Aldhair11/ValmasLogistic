using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Queries.GetBranchesPage;

public record GetBranchesPageQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? ActiveOnly = null) : IRequest<PagedResult<BranchDto>>;
