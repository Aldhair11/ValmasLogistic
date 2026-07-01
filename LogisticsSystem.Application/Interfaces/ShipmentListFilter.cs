using LogisticsSystem.Domain.Enums;

namespace LogisticsSystem.Application.Interfaces;

public sealed record ShipmentListFilter(
    int Page,
    int PageSize,
    ShipmentStatus? Status = null,
    IReadOnlyList<ShipmentStatus>? Statuses = null,
    string? Search = null,
    PaymentMethod? PaymentMethod = null,
    bool? IsPaid = null,
    DateTime? CreatedFrom = null,
    DateTime? CreatedTo = null,
    Guid? ClientCustomerProfileId = null,
    Guid? WorkerBranchId = null);
