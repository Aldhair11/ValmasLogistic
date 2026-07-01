using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Users.Commands.SetStaffUserStatus;

public sealed class SetStaffUserStatusCommandHandler
    : IRequestHandler<SetStaffUserStatusCommand, StaffUserDto>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public SetStaffUserStatusCommandHandler(
        IUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository
            ?? throw new ArgumentNullException(nameof(userRepository));
        _currentUserService = currentUserService
            ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<StaffUserDto> Handle(
        SetStaffUserStatusCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await _currentUserService.GetCurrentUserAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user context is required.");

        if (!request.IsActive && currentUser.UserId == request.Id)
        {
            throw new InvalidOperationException("You cannot deactivate your own account.");
        }

        var user = await _userRepository.GetStaffByIdForUpdateAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"User with id '{request.Id}' was not found.");

        if (request.IsActive)
        {
            user.Activate();
        }
        else
        {
            user.Deactivate();
        }

        await _userRepository.SaveChangesAsync(cancellationToken);

        var updated = await _userRepository.GetByIdAsync(user.Id, cancellationToken)
            ?? user;

        return StaffUserDtoMapper.ToDto(updated);
    }
}
