using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Exceptions;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Domain.Constants;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.UpdateStaffUser;

public sealed class UpdateStaffUserCommandHandler
    : IRequestHandler<UpdateStaffUserCommand, StaffUserDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateStaffUserCommandHandler(
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
        UpdateStaffUserCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await _userRepository.GetStaffByIdForUpdateAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"User with id '{request.Id}' was not found.");

        if (await _userRepository.ExistsByUsernameExceptIdAsync(
                request.Username,
                request.Id,
                cancellationToken))
        {
            throw new ConflictException("Username already exists.");
        }

        if (request.Role == UserRoles.Worker)
        {
            if (request.BranchId is not { } branchId || branchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "BranchId is required when role is Worker.",
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
                "BranchId must be null when role is Admin.",
                nameof(request.BranchId));
        }

        user.UpdateStaffProfile(request.Username, request.Role, request.BranchId);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.UpdatePassword(_passwordHasher.Hash(request.Password));
        }

        await _userRepository.SaveChangesAsync(cancellationToken);

        var updated = await _userRepository.GetByIdAsync(user.Id, cancellationToken)
            ?? user;

        return StaffUserDtoMapper.ToDto(updated);
    }
}
