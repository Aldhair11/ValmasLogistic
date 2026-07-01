namespace LogisticsSystem.Domain.Constants;

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Worker = "Worker";
    public const string Client = "Client";

    public static bool IsValid(string role) =>
        role is Admin or Worker or Client;

    public static bool IsStaffRole(string role) =>
        role is Admin or Worker;
}
