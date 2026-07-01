namespace LogisticsSystem.Application.Interfaces;


public interface IShipmentNotificationService
{
    Task NotifyShipmentUpdatedAsync(
        Guid shipmentId,
        CancellationToken cancellationToken = default);
}
