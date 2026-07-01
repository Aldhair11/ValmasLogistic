using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Infrastructure.Persistence;

internal static class SecuritySeedData
{
    internal static readonly Guid AdminUserId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    internal const string AdminUsername = "admin";

    internal const string AdminPasswordHash =
        "$2a$11$bGxxpgCIt0wCgkdmV2vkVu0ODRpeFY4sBk3E7avIiT7rZeC/NCkcC";

    internal static User CreateAdminUser() =>
        new(AdminUserId, AdminUsername, AdminPasswordHash, UserRoles.Admin);
}
