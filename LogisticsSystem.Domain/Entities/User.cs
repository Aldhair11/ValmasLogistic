using LogisticsSystem.Domain.Constants;

namespace LogisticsSystem.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Username { get; private set; }
    public string PasswordHash { get; private set; }
    public string Role { get; private set; }
    public Guid? CustomerProfileId { get; private set; }
    public Customer? CustomerProfile { get; private set; }
    public Guid? BranchId { get; private set; }
    public Branch? Branch { get; private set; }
    public bool IsActive { get; private set; }

    private User()
    {
        Username = null!;
        PasswordHash = null!;
        Role = null!;
    }

    public User(
        Guid id,
        string username,
        string passwordHash,
        string role,
        Guid? customerProfileId = null,
        Guid? branchId = null)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(username);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        if (!UserRoles.IsValid(role))
        {
            throw new ArgumentException($"Invalid role '{role}'.", nameof(role));
        }

        if (role == UserRoles.Client)
        {
            if (customerProfileId is null || customerProfileId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Client users must be linked to a customer profile.",
                    nameof(customerProfileId));
            }

            if (branchId is not null)
            {
                throw new ArgumentException(
                    "Client users cannot be assigned to a branch.",
                    nameof(branchId));
            }
        }

        if (role == UserRoles.Worker)
        {
            if (branchId is null || branchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Worker users must be assigned to a branch.",
                    nameof(branchId));
            }
        }

        if (role == UserRoles.Admin && branchId is not null)
        {
            throw new ArgumentException(
                "Admin users cannot be assigned to a branch.",
                nameof(branchId));
        }

        Id = id;
        Username = username;
        PasswordHash = passwordHash;
        Role = role;
        CustomerProfileId = customerProfileId;
        BranchId = branchId;
        IsActive = true;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public void UpdatePassword(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    public void UpdateStaffProfile(string username, string role, Guid? branchId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);

        if (!UserRoles.IsValid(role) || !UserRoles.IsStaffRole(role))
        {
            throw new ArgumentException(
                $"Invalid staff role '{role}'.",
                nameof(role));
        }

        if (role == UserRoles.Worker)
        {
            if (branchId is null || branchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Worker users must be assigned to a branch.",
                    nameof(branchId));
            }
        }
        else if (branchId is not null)
        {
            throw new ArgumentException(
                "Admin users cannot be assigned to a branch.",
                nameof(branchId));
        }

        Username = username.Trim();
        Role = role;
        BranchId = role == UserRoles.Worker ? branchId : null;
    }

    public void AssignBranch(Guid branchId)
    {
        if (Role != UserRoles.Worker)
        {
            throw new InvalidOperationException("Only worker users can be assigned to a branch.");
        }

        if (branchId == Guid.Empty)
        {
            throw new ArgumentException("Branch id cannot be empty.", nameof(branchId));
        }

        BranchId = branchId;
    }

    public void LinkCustomerProfile(Guid customerId)
    {
        if (customerId == Guid.Empty)
        {
            throw new ArgumentException("Customer id cannot be empty.", nameof(customerId));
        }

        CustomerProfileId = customerId;
    }
}
