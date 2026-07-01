using LogisticsSystem.Application.DTOs;
using MediatR;

namespace LogisticsSystem.Application.UseCases.Cash.Queries.GetCashSummary;

public sealed record GetCashSummaryQuery() : IRequest<CashSummaryDto>;
