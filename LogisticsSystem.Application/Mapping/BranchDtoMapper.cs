using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Mapping;

public static class BranchDtoMapper
{
    public static BranchDto ToDto(Branch branch) =>
        new(
            branch.Id,
            branch.Phone,
            branch.Name,
            branch.Address,
            branch.BusinessHours,
            branch.Country,
            branch.Department,
            branch.Province,
            branch.District,
            branch.IsActive);
}
