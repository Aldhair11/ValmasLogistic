export type ShipmentStatus =
  | 'Pending'
  | 'InTransit'
  | 'Delivered'
  | 'Cancelled'
  | 'PendingValidation';

export type PaymentMethod = 'PrePaid' | 'CashOnDelivery';

export type PackageType = 'Envelope' | 'Bag' | 'Box';

export type PackageSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type DeliveryType = 'HomeDelivery' | 'BranchPickup';

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ShipmentDto {
  id: string;
  origin: AddressDto;
  destination: AddressDto;
  weightInKg: number;
  status: ShipmentStatus;
  trackingNumber: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  shippingAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  type?: PackageType;
  size?: PackageSize;
  isFragile?: boolean;
  contentDescription?: string;
  pickupRequired?: boolean;
  deliveryType?: DeliveryType;
  destinationBranchId?: string | null;
  destinationBranchName?: string | null;
  senderId?: string | null;
  recipientId?: string | null;
  assignedCourierId?: string | null;
  currentBranchId?: string | null;
  senderName?: string | null;
  recipientName?: string | null;
  courierName?: string | null;
  branchName?: string | null;
}

export interface ShipmentReceiptDto extends ShipmentDto {
  deliveryPin: string;
}

export interface PublicShipmentDto {
  trackingNumber: string;
  originCity: string;
  destinationCity: string;
  status: ShipmentStatus;
  weightInKg: number;
  createdAt: string;
}

export interface CreateShipmentCommand {
  origin: AddressDto;
  destination: AddressDto;
  weightInKg: number;
  pin: string;
  paymentMethod: PaymentMethod;
  type: PackageType;
  size: PackageSize;
  isFragile: boolean;
  contentDescription: string;
  pickupRequired: boolean;
  deliveryType: DeliveryType;
  senderId?: string;
  recipientId?: string;
  currentBranchId?: string;
  destinationBranchId?: string;
  shippingAmount: number;
}

export interface ShipmentMetricsDto {
  totalShipments: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  lastUpdatedAt: string | null;
  newShipmentsToday: number;
}

export interface CashSummaryDto {
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  collectedTodayCount: number;
  collectedTodayAmount: number;
  prePaidCount: number;
  prePaidAmount: number;
  cashOnDeliveryPendingCount: number;
  cashOnDeliveryPendingAmount: number;
}

export interface GetShipmentsPageParams {
  page?: number;
  pageSize?: number;
  status?: ShipmentStatus;
  statuses?: string;
  search?: string;
  paymentMethod?: PaymentMethod;
  isPaid?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  type?: string;
  instance?: string;
  [key: string]: unknown;
}
