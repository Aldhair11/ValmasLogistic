using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogisticsSystem.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : IUserRepository
{
    private const int MaxPageSize = 100;

    private readonly LogisticsDbContext _dbContext;

    public UserRepository(LogisticsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            return Task.FromResult<User?>(null);
        }

        return _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public Task<User?> GetStaffByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            return Task.FromResult<User?>(null);
        }

        return _dbContext.Users
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(
                u => u.Id == id
                    && (u.Role == Domain.Constants.UserRoles.Admin
                        || u.Role == Domain.Constants.UserRoles.Worker),
                cancellationToken);
    }

    public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);

        return _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public Task<Guid?> GetCustomerProfileIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            return Task.FromResult<Guid?>(null);
        }

        return _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.CustomerProfileId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);

        return _dbContext.Users.AnyAsync(u => u.Username == username, cancellationToken);
    }

    public Task<bool> ExistsByUsernameExceptIdAsync(
        string username,
        Guid exceptId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);

        return _dbContext.Users.AnyAsync(
            u => u.Username == username && u.Id != exceptId,
            cancellationToken);
    }

    public async Task<(IReadOnlyList<User> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize switch
        {
            < 1 => 10,
            > MaxPageSize => MaxPageSize,
            _ => pageSize,
        };

        var query = _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Branch)
            .Where(u => u.Role == Domain.Constants.UserRoles.Admin
                || u.Role == Domain.Constants.UserRoles.Worker);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                u.Username.Contains(term) || u.Role.Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(u => u.Username)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        await _dbContext.Users.AddAsync(user, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
