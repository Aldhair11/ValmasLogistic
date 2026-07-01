using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;

namespace LogisticsSystem.Application.Security;

public sealed record ShipmentAccessFilter(
    Guid? ClientCustomerProfileId,
    Guid? WorkerBranchId);

internal static class ShipmentTenancy
{
    public static bool BelongsToCustomerProfile(Shipment shipment, Guid customerProfileId) =>
        shipment.SenderId == customerProfileId || shipment.RecipientId == customerProfileId;

    public static ShipmentAccessFilter ResolveAccess(CurrentUserContext user)
    {
        ArgumentNullException.ThrowIfNull(user);

        if (user.Role == UserRoles.Client)
        {
            return new ShipmentAccessFilter(
                ResolveClientCustomerProfileId(user),
                WorkerBranchId: null);
        }

        if (user.Role == UserRoles.Worker)
        {
            return new ShipmentAccessFilter(
                ClientCustomerProfileId: null,
                WorkerBranchId: ResolveWorkerBranchId(user));
        }

        return new ShipmentAccessFilter(null, null);
    }

    public static Guid? ResolveClientCustomerProfileId(CurrentUserContext user)
    {
        ArgumentNullException.ThrowIfNull(user);

        if (user.Role != UserRoles.Client)
        {
            return null;
        }

        if (user.CustomerProfileId is not { } profileId || profileId == Guid.Empty)
        {
            throw new UnauthorizedAccessException(
                "Client account is not linked to a customer profile.");
        }

        return profileId;
    }

    public static Guid ResolveWorkerBranchId(CurrentUserContext user)
    {
        ArgumentNullException.ThrowIfNull(user);

        if (user.Role != UserRoles.Worker)
        {
            throw new InvalidOperationException("Worker branch resolution is only valid for worker users.");
        }

        if (user.BranchId is not { } branchId || branchId == Guid.Empty)
        {
            throw new UnauthorizedAccessException(
                "Worker account is not assigned to a branch.");
        }

        return branchId;
    }
}
