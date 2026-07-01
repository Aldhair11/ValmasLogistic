namespace LogisticsSystem.Application.DTOs;

public record StaffUserDto(
    Guid Id,
    string Username,
    string Role,
    Guid? BranchId,
    string? BranchName,
    bool IsActive);
