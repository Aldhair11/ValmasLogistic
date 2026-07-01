using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Mapping;

internal static class StaffUserDtoMapper
{
    public static StaffUserDto ToDto(User user) =>
        new(
            user.Id,
            user.Username,
            user.Role,
            user.BranchId,
            user.Branch?.Name,
            user.IsActive);
}
