namespace LogisticsSystem.Application.DTOs;

public record BranchDto(
    Guid Id,
    string Phone,
    string Name,
    string Address,
    string BusinessHours,
    string Country,
    string Department,
    string Province,
    string District,
    bool IsActive);
