export interface CustomerDto {
  id: string;
  dni: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface CreateCustomerRequest {
  dni: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface VehicleDto {
  id: string;
  licensePlate: string;
  model: string;
  capacityInKg: number;
  isActive: boolean;
}

export interface CreateVehicleRequest {
  licensePlate: string;
  model: string;
  capacityInKg: number;
}

export interface CourierDto {
  id: string;
  fullName: string;
  phone: string;
  isAvailable: boolean;
  isActive: boolean;
  currentVehicleId: string | null;
  currentVehicle?: VehicleDto | null;
}

export interface CreateCourierRequest {
  fullName: string;
  phone: string;
  isAvailable: boolean;
  currentVehicleId?: string | null;
}

export interface BranchDto {
  id: string;
  phone: string;
  name: string;
  address: string;
  businessHours: string;
  country: string;
  department: string;
  province: string;
  district: string;
  isActive: boolean;
}

export interface CreateBranchRequest {
  phone: string;
  name: string;
  address: string;
  businessHours: string;
  country: string;
  department: string;
  province: string;
  district: string;
}
