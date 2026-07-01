using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Queries.GetUsersPage;

public sealed class GetUsersPageQueryHandler
    : IRequestHandler<GetUsersPageQuery, PagedResult<StaffUserDto>>
{
    private readonly IUserRepository _userRepository;

    public GetUsersPageQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public async Task<PagedResult<StaffUserDto>> Handle(
        GetUsersPageQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var (items, totalCount) = await _userRepository.GetPageAsync(
            request.Page,
            request.PageSize,
            request.Search,
            cancellationToken);

        var dtos = items.Select(StaffUserDtoMapper.ToDto).ToList();
        var safePage = request.Page < 1 ? 1 : request.Page;
        var safePageSize = request.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => request.PageSize,
        };

        return new PagedResult<StaffUserDto>(dtos, totalCount, safePage, safePageSize);
    }
}
