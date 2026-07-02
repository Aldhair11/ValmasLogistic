import { apiClient } from './api';
import { notifyError, notifySuccess } from '../lib/notify';
import type { PagedResult } from '../types';
import type {
  BranchDto,
  CourierDto,
  CreateBranchRequest,
  CreateCourierRequest,
  CreateCustomerRequest,
  CreateVehicleRequest,
  CustomerDto,
  VehicleDto,
} from '../types/masters';

export interface GetCustomersPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}

export const CustomerService = {
  async getPage(
    params: GetCustomersPageParams = {},
  ): Promise<PagedResult<CustomerDto>> {
    const { page = 1, pageSize = 10, search, activeOnly } = params;
    const response = await apiClient.get<PagedResult<CustomerDto>>(
      '/api/customers',
      {
        params: {
          page,
          pageSize,
          ...(search?.trim() ? { search: search.trim() } : {}),
          ...(activeOnly ? { activeOnly: true } : {}),
        },
      },
    );
    return response.data;
  },

  async getActiveLookup(): Promise<CustomerDto[]> {
    const response = await apiClient.get<PagedResult<CustomerDto>>(
      '/api/customers',
      {
        params: { page: 1, pageSize: 100, activeOnly: true },
      },
    );
    return response.data.items;
  },

  async getByDni(dni: string): Promise<CustomerDto> {
    const response = await apiClient.get<CustomerDto>(
      `/api/customers/by-dni/${encodeURIComponent(dni.trim())}`,
    );
    return response.data;
  },

  async create(data: CreateCustomerRequest): Promise<CustomerDto> {
    try {
      const response = await apiClient.post<CustomerDto>('/api/customers', data);
      notifySuccess(
        'Cliente registrado',
        `${response.data.fullName} fue agregado al cat├ílogo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar el cliente.');
      throw error;
    }
  },

  async update(id: string, data: CreateCustomerRequest): Promise<CustomerDto> {
    try {
      const response = await apiClient.put<CustomerDto>(
        `/api/customers/${id}`,
        data,
      );
      notifySuccess(
        'Cliente actualizado',
        `${response.data.fullName} fue modificado correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el cliente.');
      throw error;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<CustomerDto> {
    try {
      const response = await apiClient.patch<CustomerDto>(
        `/api/customers/${id}/status`,
        { isActive },
      );
      notifySuccess(
        isActive ? 'Cliente reactivado' : 'Cliente desactivado',
        isActive
          ? `${response.data.fullName} vuelve a estar activo.`
          : `${response.data.fullName} fue desactivado del cat├ílogo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(
        error,
        isActive
          ? 'No se pudo reactivar el cliente.'
          : 'No se pudo desactivar el cliente.',
      );
      throw error;
    }
  },
};

export interface GetVehiclesPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}

export interface GetCouriersPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isAvailable?: boolean;
  activeOnly?: boolean;
}

export const VehicleService = {
  async getPage(
    params: GetVehiclesPageParams = {},
  ): Promise<PagedResult<VehicleDto>> {
    const { page = 1, pageSize = 10, search, activeOnly } = params;
    const response = await apiClient.get<PagedResult<VehicleDto>>('/api/vehicles', {
      params: {
        page,
        pageSize,
        ...(search?.trim() ? { search: search.trim() } : {}),
        ...(activeOnly ? { activeOnly: true } : {}),
      },
    });
    return response.data;
  },

  async getActiveLookup(): Promise<VehicleDto[]> {
    const response = await apiClient.get<PagedResult<VehicleDto>>('/api/vehicles', {
      params: { page: 1, pageSize: 100, activeOnly: true },
    });
    return response.data.items;
  },

  async create(data: CreateVehicleRequest): Promise<VehicleDto> {
    try {
      const response = await apiClient.post<VehicleDto>('/api/vehicles', data);
      notifySuccess(
        'Veh├¡culo registrado',
        `Placa ${response.data.licensePlate} agregada a la flota.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar el veh├¡culo.');
      throw error;
    }
  },

  async update(id: string, data: CreateVehicleRequest): Promise<VehicleDto> {
    try {
      const response = await apiClient.put<VehicleDto>(`/api/vehicles/${id}`, data);
      notifySuccess(
        'Veh├¡culo actualizado',
        `Placa ${response.data.licensePlate} fue modificada correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el veh├¡culo.');
      throw error;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<VehicleDto> {
    try {
      const response = await apiClient.patch<VehicleDto>(
        `/api/vehicles/${id}/status`,
        { isActive },
      );
      notifySuccess(
        isActive ? 'Veh├¡culo reactivado' : 'Veh├¡culo desactivado',
        isActive
          ? `Placa ${response.data.licensePlate} vuelve a estar activa.`
          : `Placa ${response.data.licensePlate} fue desactivada del cat├ílogo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(
        error,
        isActive
          ? 'No se pudo reactivar el veh├¡culo.'
          : 'No se pudo desactivar el veh├¡culo.',
      );
      throw error;
    }
  },
};

export const CourierService = {
  async getPage(
    params: GetCouriersPageParams = {},
  ): Promise<PagedResult<CourierDto>> {
    const { page = 1, pageSize = 10, search, isAvailable, activeOnly } = params;
    const response = await apiClient.get<PagedResult<CourierDto>>('/api/couriers', {
      params: {
        page,
        pageSize,
        ...(search?.trim() ? { search: search.trim() } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
        ...(activeOnly ? { activeOnly: true } : {}),
      },
    });
    return response.data;
  },

  async getForAssignment(): Promise<CourierDto[]> {
    const response = await apiClient.get<PagedResult<CourierDto>>('/api/couriers', {
      params: { page: 1, pageSize: 100, activeOnly: true, isAvailable: true },
    });
    return response.data.items;
  },

  async create(data: CreateCourierRequest): Promise<CourierDto> {
    try {
      const response = await apiClient.post<CourierDto>('/api/couriers', data);
      notifySuccess(
        'Repartidor registrado',
        `${response.data.fullName} fue agregado al equipo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar el repartidor.');
      throw error;
    }
  },

  async update(id: string, data: CreateCourierRequest): Promise<CourierDto> {
    try {
      const response = await apiClient.put<CourierDto>(`/api/couriers/${id}`, data);
      notifySuccess(
        'Repartidor actualizado',
        `${response.data.fullName} fue modificado correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el repartidor.');
      throw error;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<CourierDto> {
    try {
      const response = await apiClient.patch<CourierDto>(
        `/api/couriers/${id}/status`,
        { isActive },
      );
      notifySuccess(
        isActive ? 'Repartidor reactivado' : 'Repartidor desactivado',
        isActive
          ? `${response.data.fullName} vuelve a estar activo.`
          : `${response.data.fullName} fue desactivado del cat├ílogo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(
        error,
        isActive
          ? 'No se pudo reactivar el repartidor.'
          : 'No se pudo desactivar el repartidor.',
      );
      throw error;
    }
  },
};

export interface GetBranchesPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}

export const BranchService = {
  async getPage(
    params: GetBranchesPageParams = {},
  ): Promise<PagedResult<BranchDto>> {
    const { page = 1, pageSize = 10, search, activeOnly } = params;
    const response = await apiClient.get<PagedResult<BranchDto>>('/api/branches', {
      params: {
        page,
        pageSize,
        ...(search?.trim() ? { search: search.trim() } : {}),
        ...(activeOnly ? { activeOnly: true } : {}),
      },
    });
    return response.data;
  },

  async getActiveLookup(): Promise<BranchDto[]> {
    const response = await apiClient.get<PagedResult<BranchDto>>('/api/branches', {
      params: { page: 1, pageSize: 100, activeOnly: true },
    });
    return response.data.items;
  },

  async create(data: CreateBranchRequest): Promise<BranchDto> {
    try {
      const response = await apiClient.post<BranchDto>('/api/branches', data);
      notifySuccess(
        'Sucursal registrada',
        `${response.data.name} (${response.data.phone}) fue agregada correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar la sucursal.');
      throw error;
    }
  },

  async update(id: string, data: CreateBranchRequest): Promise<BranchDto> {
    try {
      const response = await apiClient.put<BranchDto>(`/api/branches/${id}`, data);
      notifySuccess(
        'Sucursal actualizada',
        `${response.data.name} fue modificada correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo actualizar la sucursal.');
      throw error;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<BranchDto> {
    try {
      const response = await apiClient.patch<BranchDto>(
        `/api/branches/${id}/status`,
        { isActive },
      );
      notifySuccess(
        isActive ? 'Sucursal reactivada' : 'Sucursal desactivada',
        isActive
          ? `${response.data.name} vuelve a estar activa.`
          : `${response.data.name} fue desactivada del cat├ílogo.`,
      );
      return response.data;
    } catch (error) {
      notifyError(
        error,
        isActive
          ? 'No se pudo reactivar la sucursal.'
          : 'No se pudo desactivar la sucursal.',
      );
      throw error;
    }
  },
};
