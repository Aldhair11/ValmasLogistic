using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace LogisticsSystem.Infrastructure.Persistence.Repositories;

public sealed class ShipmentRepository : IShipmentRepository
{
    private const int MaxPageSize = 100;

    private readonly LogisticsDbContext _dbContext;

    public ShipmentRepository(LogisticsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IShipmentRepositoryTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default)
    {
        var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        return new EfShipmentRepositoryTransaction(transaction);
    }

    public Task<bool> DestinationBranchExistsAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        if (branchId == Guid.Empty)
        {
            return Task.FromResult(false);
        }

        return _dbContext.Branches
            .AsNoTracking()
            .AnyAsync(b => b.Id == branchId, cancellationToken);
    }

    public async Task AddAsync(Shipment shipment, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(shipment);

        await _dbContext.Shipments.AddAsync(shipment, cancellationToken);
    }

    public Task<Shipment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        GetByIdForUserAsync(id, clientCustomerProfileId: null, workerBranchId: null, cancellationToken);

    public Task<Shipment?> GetByIdForUserAsync(
        Guid id,
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = WithRelatedEntities(_dbContext.Shipments).Where(s => s.Id == id);
        query = ApplyTenancyFilter(query, clientCustomerProfileId, workerBranchId);
        return query.FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Shipment?> GetByTrackingNumberAsync(
        string trackingNumber,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(trackingNumber);

        return _dbContext.Shipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber, cancellationToken);
    }

    public async Task<(IReadOnlyList<Shipment> Items, int TotalCount)> GetPageAsync(
        ShipmentListFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var safePage = filter.Page < 1 ? 1 : filter.Page;
        var safePageSize = filter.PageSize switch
        {
            < 1 => 10,
            > MaxPageSize => MaxPageSize,
            _ => filter.PageSize,
        };

        var query = WithRelatedEntities(_dbContext.Shipments.AsNoTracking());
        query = ApplyTenancyFilter(
            query,
            filter.ClientCustomerProfileId,
            filter.WorkerBranchId);
        query = ApplyListFilters(query, filter);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<CashSummaryDto> GetCashSummaryAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyTenancyFilter(
            _dbContext.Shipments.AsNoTracking(),
            clientCustomerProfileId,
            workerBranchId);

        var activeQuery = query.Where(s => s.Status != ShipmentStatus.Cancelled);

        var pendingQuery = activeQuery.Where(s => !s.IsPaid);
        var pendingCount = await pendingQuery.CountAsync(cancellationToken);
        var pendingAmount = await pendingQuery.SumAsync(s => s.ShippingAmount, cancellationToken);

        var todayStart = DateTime.UtcNow.Date;
        var collectedTodayQuery = activeQuery.Where(
            s => s.IsPaid && s.PaidAt != null && s.PaidAt >= todayStart);
        var collectedTodayCount = await collectedTodayQuery.CountAsync(cancellationToken);
        var collectedTodayAmount = await collectedTodayQuery.SumAsync(
            s => s.ShippingAmount,
            cancellationToken);

        var prePaidQuery = activeQuery.Where(
            s => s.PaymentMethod == PaymentMethod.PrePaid && s.IsPaid);
        var prePaidCount = await prePaidQuery.CountAsync(cancellationToken);
        var prePaidAmount = await prePaidQuery.SumAsync(s => s.ShippingAmount, cancellationToken);

        var codPendingQuery = activeQuery.Where(
            s => s.PaymentMethod == PaymentMethod.CashOnDelivery && !s.IsPaid);
        var codPendingCount = await codPendingQuery.CountAsync(cancellationToken);
        var codPendingAmount = await codPendingQuery.SumAsync(s => s.ShippingAmount, cancellationToken);

        return new CashSummaryDto(
            pendingCount,
            pendingAmount,
            collectedTodayCount,
            collectedTodayAmount,
            prePaidCount,
            prePaidAmount,
            codPendingCount,
            codPendingAmount);
    }

    public async Task<IReadOnlyDictionary<ShipmentStatus, int>> GetCountByStatusAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyTenancyFilter(
            _dbContext.Shipments.AsNoTracking(),
            clientCustomerProfileId,
            workerBranchId);

        var counts = await query
            .GroupBy(s => s.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        return counts;
    }

    public async Task<DateTime?> GetLastCreatedAtAsync(
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyTenancyFilter(
            _dbContext.Shipments.AsNoTracking(),
            clientCustomerProfileId,
            workerBranchId);

        return await query
            .Select(s => (DateTime?)s.CreatedAt)
            .MaxAsync(cancellationToken);
    }

    public Task<int> GetCountCreatedSinceAsync(
        DateTime sinceUtc,
        Guid? clientCustomerProfileId = null,
        Guid? workerBranchId = null,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyTenancyFilter(
            _dbContext.Shipments.AsNoTracking(),
            clientCustomerProfileId,
            workerBranchId);

        return query.CountAsync(s => s.CreatedAt >= sinceUtc, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<Shipment> ApplyTenancyFilter(
        IQueryable<Shipment> query,
        Guid? clientCustomerProfileId,
        Guid? workerBranchId)
    {
        if (clientCustomerProfileId is { } profileId)
        {
            return query.Where(s =>
                s.SenderId == profileId || s.RecipientId == profileId);
        }

        if (workerBranchId is { } branchId)
        {
            return query.Where(s => s.CurrentBranchId == branchId);
        }

        return query;
    }

    private static IQueryable<Shipment> ApplyListFilters(
        IQueryable<Shipment> query,
        ShipmentListFilter filter)
    {
        if (filter.Statuses is { Count: > 0 } statuses)
        {
            query = query.Where(s => statuses.Contains(s.Status));
        }
        else if (filter.Status.HasValue)
        {
            query = query.Where(s => s.Status == filter.Status.Value);
        }

        if (filter.PaymentMethod.HasValue)
        {
            query = query.Where(s => s.PaymentMethod == filter.PaymentMethod.Value);
        }

        if (filter.IsPaid.HasValue)
        {
            query = query.Where(s => s.IsPaid == filter.IsPaid.Value);
        }

        if (filter.CreatedFrom.HasValue)
        {
            query = query.Where(s => s.CreatedAt >= filter.CreatedFrom.Value);
        }

        if (filter.CreatedTo.HasValue)
        {
            query = query.Where(s => s.CreatedAt <= filter.CreatedTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(s =>
                s.TrackingNumber.Contains(term)
                || (s.Sender != null && s.Sender.FullName.Contains(term))
                || (s.Recipient != null && s.Recipient.FullName.Contains(term))
                || s.Origin.City.Contains(term)
                || s.Destination.City.Contains(term)
                || (s.CurrentBranch != null && s.CurrentBranch.Name.Contains(term)));
        }

        return query;
    }

    private static IQueryable<Shipment> WithRelatedEntities(IQueryable<Shipment> query) =>
        query
            .Include(s => s.Sender)
            .Include(s => s.Recipient)
            .Include(s => s.AssignedCourier)
            .Include(s => s.CurrentBranch)
            .Include(s => s.DestinationBranch);

    private sealed class EfShipmentRepositoryTransaction : IShipmentRepositoryTransaction
    {
        private readonly IDbContextTransaction _transaction;

        public EfShipmentRepositoryTransaction(IDbContextTransaction transaction)
        {
            _transaction = transaction ?? throw new ArgumentNullException(nameof(transaction));
        }

        public Task CommitAsync(CancellationToken cancellationToken = default) =>
            _transaction.CommitAsync(cancellationToken);

        public Task RollbackAsync(CancellationToken cancellationToken = default) =>
            _transaction.RollbackAsync(cancellationToken);

        public ValueTask DisposeAsync() => _transaction.DisposeAsync();
    }
}
