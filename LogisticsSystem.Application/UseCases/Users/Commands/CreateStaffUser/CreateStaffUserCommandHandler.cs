using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Exceptions;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.CreateStaffUser;

public sealed class CreateStaffUserCommandHandler
    : IRequestHandler<CreateStaffUserCommand, StaffUserDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IPasswordHasher _passwordHasher;

    public CreateStaffUserCommandHandler(
        IUserRepository userRepository,
        IBranchRepository branchRepository,
        IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
        _branchRepository = branchRepository
            ?? throw new ArgumentNullException(nameof(branchRepository));
        _passwordHasher = passwordHasher
            ?? throw new ArgumentNullException(nameof(passwordHasher));
    }

    public async Task<StaffUserDto> Handle(
        CreateStaffUserCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!UserRoles.IsStaffRole(request.Role))
        {
            throw new ArgumentException(
                $"Invalid role. Allowed: {UserRoles.Admin}, {UserRoles.Worker}.",
                nameof(request.Role));
        }

        if (await _userRepository.ExistsByUsernameAsync(request.Username, cancellationToken))
        {
            throw new ConflictException("Username already exists.");
        }

        if (request.Role == UserRoles.Worker)
        {
            if (request.BranchId is not { } branchId || branchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "BranchId is required when creating a worker user.",
                    nameof(request.BranchId));
            }

            var branch = await _branchRepository.GetByIdAsync(branchId, cancellationToken)
                ?? throw new KeyNotFoundException($"Branch with id '{branchId}' was not found.");

            if (!branch.IsActive)
            {
                throw new ArgumentException("Cannot assign a worker to an inactive branch.");
            }
        }
        else if (request.BranchId is not null)
        {
            throw new ArgumentException(
                "BranchId must be null when creating an admin user.",
                nameof(request.BranchId));
        }

        var user = new User(
            Guid.NewGuid(),
            request.Username.Trim(),
            _passwordHasher.Hash(request.Password),
            request.Role,
            branchId: request.BranchId);

        await _userRepository.AddAsync(user, cancellationToken);
        await _userRepository.SaveChangesAsync(cancellationToken);

        var created = await _userRepository.GetByIdAsync(user.Id, cancellationToken)
            ?? user;

        return StaffUserDtoMapper.ToDto(created);
    }
}
