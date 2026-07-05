import { ShipmentService } from '../services/api';
import type { ShipmentDto, ShipmentMetricsDto } from '../types';

const METRICS_PAGE_SIZE = 100;

export function buildMetricsFromShipments(
  shipments: ShipmentDto[],
): ShipmentMetricsDto {
  let pendingOnly = 0;
  let pendingValidation = 0;
  let inTransit = 0;
  let delivered = 0;
  let cancelled = 0;
  let lastUpdatedAt: string | null = null;
  const sinceUtc = Date.now() - 24 * 60 * 60 * 1000;
  let newShipmentsToday = 0;

  for (const shipment of shipments) {
    switch (shipment.status) {
      case 'Pending':
        pendingOnly++;
        break;
      case 'PendingValidation':
        pendingValidation++;
        break;
      case 'InTransit':
        inTransit++;
        break;
      case 'Delivered':
        delivered++;
        break;
      case 'Cancelled':
        cancelled++;
        break;
    }

    if (!lastUpdatedAt || shipment.createdAt > lastUpdatedAt) {
      lastUpdatedAt = shipment.createdAt;
    }

    const createdAtMs = new Date(shipment.createdAt).getTime();
    if (!Number.isNaN(createdAtMs) && createdAtMs >= sinceUtc) {
      newShipmentsToday++;
    }
  }

  return {
    totalShipments: shipments.length,
    pending: pendingOnly + pendingValidation,
    inTransit,
    delivered,
    cancelled,
    lastUpdatedAt,
    newShipmentsToday,
  };
}

export async function fetchAllTenantShipments(): Promise<ShipmentDto[]> {
  const all: ShipmentDto[] = [];
  let page = 1;
  let totalCount = Number.POSITIVE_INFINITY;

  while (all.length < totalCount) {
    const result = await ShipmentService.getAll({
      page,
      pageSize: METRICS_PAGE_SIZE,
    });

    totalCount = result.totalCount;
    all.push(...result.items);

    if (result.items.length === 0) {
      break;
    }

    page++;
  }

  return all;
}
