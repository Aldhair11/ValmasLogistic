using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LogisticsSystem.Infrastructure.Services;

public sealed class ShipmentNotificationService : IShipmentNotificationService
{
    private readonly IHubContext<ShipmentHub> _hubContext;

    public ShipmentNotificationService(IHubContext<ShipmentHub> hubContext)
    {
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
    }

    public Task NotifyShipmentUpdatedAsync(
        Guid shipmentId,
        CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync(
            "ShipmentUpdated",
            shipmentId,
            cancellationToken);
    }
}
