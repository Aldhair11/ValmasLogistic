using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Commands.SetBranchStatus;

public sealed class SetBranchStatusCommandHandler
    : IRequestHandler<SetBranchStatusCommand, BranchDto>
{
    private readonly IBranchRepository _branchRepository;

    public SetBranchStatusCommandHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository
            ?? throw new ArgumentNullException(nameof(branchRepository));
    }

    public async Task<BranchDto> Handle(
        SetBranchStatusCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Branch not found.");

        if (request.IsActive)
        {
            branch.Activate();
        }
        else
        {
            branch.Deactivate();
        }

        await _branchRepository.SaveChangesAsync(cancellationToken);

        return BranchDtoMapper.ToDto(branch);
    }
}
