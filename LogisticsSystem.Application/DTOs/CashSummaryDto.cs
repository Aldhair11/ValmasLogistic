namespace LogisticsSystem.Application.DTOs;

public record CashSummaryDto(
    int PendingPaymentsCount,
    decimal PendingPaymentsAmount,
    int CollectedTodayCount,
    decimal CollectedTodayAmount,
    int PrePaidCount,
    decimal PrePaidAmount,
    int CashOnDeliveryPendingCount,
    decimal CashOnDeliveryPendingAmount);
