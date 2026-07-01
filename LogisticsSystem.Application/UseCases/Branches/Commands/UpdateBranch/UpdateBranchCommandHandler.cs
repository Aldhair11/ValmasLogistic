using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Commands.UpdateBranch;

public sealed class UpdateBranchCommandHandler
    : IRequestHandler<UpdateBranchCommand, BranchDto>
{
    private readonly IBranchRepository _branchRepository;

    public UpdateBranchCommandHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository
            ?? throw new ArgumentNullException(nameof(branchRepository));
    }

    public async Task<BranchDto> Handle(
        UpdateBranchCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Branch not found.");

        branch.Update(
            request.Phone,
            request.Name,
            request.Address,
            request.BusinessHours,
            request.Country,
            request.Department,
            request.Province,
            request.District);

        await _branchRepository.SaveChangesAsync(cancellationToken);

        return BranchDtoMapper.ToDto(branch);
    }
}
