using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Domain.Entities;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Branches.Commands.CreateBranch;

public sealed class CreateBranchCommandHandler
    : IRequestHandler<CreateBranchCommand, BranchDto>
{
    private readonly IBranchRepository _branchRepository;

    public CreateBranchCommandHandler(IBranchRepository branchRepository)
    {
        _branchRepository = branchRepository
            ?? throw new ArgumentNullException(nameof(branchRepository));
    }

    public async Task<BranchDto> Handle(
        CreateBranchCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var branch = new Branch(
            Guid.NewGuid(),
            request.Phone,
            request.Name,
            request.Address,
            request.BusinessHours,
            request.Country,
            request.Department,
            request.Province,
            request.District);

        await _branchRepository.AddAsync(branch, cancellationToken);
        await _branchRepository.SaveChangesAsync(cancellationToken);

        return BranchDtoMapper.ToDto(branch);
    }
}
