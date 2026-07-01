using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Queries.GetUsersPage;

public sealed record GetUsersPageQuery(
    int Page,
    int PageSize,
    string? Search) : IRequest<PagedResult<StaffUserDto>>;
