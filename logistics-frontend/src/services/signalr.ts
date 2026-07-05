import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const HUB_URL = `${baseURL}/hubs/shipments`;

export function setupSignalRConnection(
  onShipmentUpdated: (id: string) => void,
): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
    .build();

  connection.on('ShipmentUpdated', (shipmentId: string) => {
    onShipmentUpdated(shipmentId);
  });

  connection.start().catch(() => {});

  return connection;
}


export async function stopSignalRConnection(
  connection: HubConnection | null,
): Promise<void> {
  if (!connection) return;
  if (
    connection.state === HubConnectionState.Disconnected ||
    connection.state === HubConnectionState.Disconnecting
  ) {
    return;
  }
  try {
    await connection.stop();
  } catch {
  }
}
