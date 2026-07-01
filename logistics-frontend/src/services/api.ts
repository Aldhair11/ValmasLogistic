import axios from 'axios';
import { notifyError, notifySuccess } from '../lib/notify';
import { STATUS_LABEL } from '../components/StatusBadge';
import { AUTH_TOKEN_KEY } from '../context/AuthContext';
import type {
  CashSummaryDto,
  CreateShipmentCommand,
  GetShipmentsPageParams,
  PagedResult,
  PublicShipmentDto,
  ShipmentDto,
  ShipmentMetricsDto,
  ShipmentReceiptDto,
  ShipmentStatus,
} from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


apiClient.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as Record<string, string>)['Authorization'] =
          `Bearer ${token}`;
      }
    }
  } catch {
  }
  return config;
});


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!url.includes('/api/auth/login')) {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  },
);

export const ShipmentService = {
  async create(data: CreateShipmentCommand): Promise<ShipmentReceiptDto> {
    try {
      const response = await apiClient.post<ShipmentReceiptDto>(
        '/api/shipments',
        data,
      );
      notifySuccess(
        'Envío creado',
        `Tracking ${response.data.trackingNumber} registrado correctamente.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo crear el envío.');
      throw error;
    }
  },

  async getAll(
    params: GetShipmentsPageParams = {},
  ): Promise<PagedResult<ShipmentDto>> {
    const {
      page = 1,
      pageSize = 10,
      status,
      statuses,
      search,
      paymentMethod,
      isPaid,
      createdFrom,
      createdTo,
    } = params;
    const response = await apiClient.get<PagedResult<ShipmentDto>>(
      '/api/shipments',
      {
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
          ...(statuses ? { statuses } : {}),
          ...(search?.trim() ? { search: search.trim() } : {}),
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(isPaid !== undefined ? { isPaid } : {}),
          ...(createdFrom ? { createdFrom } : {}),
          ...(createdTo ? { createdTo } : {}),
        },
      },
    );
    return response.data;
  },

  async getCashSummary(): Promise<CashSummaryDto> {
    const response = await apiClient.get<CashSummaryDto>('/api/cash/summary');
    return response.data;
  },

  async collectPayment(id: string): Promise<ShipmentDto> {
    try {
      const response = await apiClient.patch<ShipmentDto>(
        `/api/shipments/${id}/collect-payment`,
      );
      notifySuccess(
        'Pago registrado',
        `Se registró el cobro del envío ${response.data.trackingNumber}.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar el cobro.');
      throw error;
    }
  },

  async getMetrics(): Promise<ShipmentMetricsDto> {
    const response = await apiClient.get<ShipmentMetricsDto>(
      '/api/shipments/metrics',
    );
    return response.data;
  },

  async getById(id: string): Promise<ShipmentDto> {
    const response = await apiClient.get<ShipmentDto>(`/api/shipments/${id}`);
    return response.data;
  },

  async updateStatus(
    id: string,
    newStatus: ShipmentStatus,
    pin?: string,
    silent = false,
    paymentCollected?: boolean,
  ): Promise<void> {
    try {
      await apiClient.patch(`/api/shipments/${id}/status`, {
        newStatus,
        pin,
        ...(paymentCollected !== undefined ? { paymentCollected } : {}),
      });
      if (!silent) {
        notifySuccess(
          'Estado actualizado',
          `El envío ahora está en ${STATUS_LABEL[newStatus]}.`,
        );
      }
    } catch (error) {
      if (!silent) {
        notifyError(error, 'No se pudo actualizar el estado del envío.');
      }
      throw error;
    }
  },

  async assignCourier(id: string, courierId: string, silent = false): Promise<void> {
    try {
      await apiClient.patch(`/api/shipments/${id}/courier`, { courierId });
      if (!silent) {
        notifySuccess('Repartidor asignado', 'La asignación se guardó correctamente.');
      }
    } catch (error) {
      if (!silent) {
        notifyError(error, 'No se pudo asignar el repartidor.');
      }
      throw error;
    }
  },

  async assignBranch(id: string, branchId: string, silent = false): Promise<void> {
    try {
      await apiClient.patch(`/api/shipments/${id}/branch`, { branchId });
      if (!silent) {
        notifySuccess('Sucursal asignada', 'La asignación se guardó correctamente.');
      }
    } catch (error) {
      if (!silent) {
        notifyError(error, 'No se pudo asignar la sucursal.');
      }
      throw error;
    }
  },

  async track(trackingNumber: string): Promise<PublicShipmentDto> {
    const response = await apiClient.get<PublicShipmentDto>(
      `/api/shipments/track/${encodeURIComponent(trackingNumber)}`,
    );
    return response.data;
  },
};

export const AuthService = {
  async login(username: string, password: string): Promise<string> {
    const response = await apiClient.post<{ token: string }>(
      '/api/auth/login',
      { username, password },
    );
    return response.data.token;
  },

  async registerClient(data: RegisterClientRequest): Promise<RegisterClientResponse> {
    const response = await apiClient.post<RegisterClientResponse>(
      '/api/users/register-client',
      data,
    );
    return response.data;
  },
};

export interface RegisterClientRequest {
  username: string;
  password: string;
  dni: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface RegisterClientResponse {
  userId: string;
  username: string;
  role: string;
  customerId: string;
  dni: string;
  fullName: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  branchId?: string | null;
}

export interface StaffUserDto {
  id: string;
  username: string;
  role: string;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
}

export interface UpdateUserRequest {
  username: string;
  role: string;
  branchId?: string | null;
  password?: string;
}

export interface CurrentUserProfile {
  id: string;
  username: string;
  role: string;
  branchId: string | null;
  branchName: string | null;
}

export interface UserDto {
  id: string;
  username: string;
  role: string;
}

export interface GetUsersPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const UserService = {
  async getPage(
    params: GetUsersPageParams = {},
  ): Promise<PagedResult<StaffUserDto>> {
    const { page = 1, pageSize = 10, search } = params;
    const response = await apiClient.get<PagedResult<StaffUserDto>>('/api/users', {
      params: {
        page,
        pageSize,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    });
    return response.data;
  },

  async getProfile(): Promise<CurrentUserProfile> {
    const response = await apiClient.get<CurrentUserProfile>('/api/auth/me');
    return response.data;
  },

  async create(data: CreateUserRequest): Promise<StaffUserDto> {
    try {
      const response = await apiClient.post<StaffUserDto>('/api/users', data);
      notifySuccess(
        'Usuario registrado',
        `"${response.data.username}" fue creado con rol ${response.data.role}.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo registrar el usuario.');
      throw error;
    }
  },

  async update(id: string, data: UpdateUserRequest): Promise<StaffUserDto> {
    try {
      const response = await apiClient.put<StaffUserDto>(`/api/users/${id}`, data);
      notifySuccess(
        'Usuario actualizado',
        `Los datos de "${response.data.username}" fueron guardados.`,
      );
      return response.data;
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el usuario.');
      throw error;
    }
  },

  async setActive(id: string, isActive: boolean): Promise<StaffUserDto> {
    try {
      const response = await apiClient.patch<StaffUserDto>(`/api/users/${id}/status`, {
        isActive,
      });
      notifySuccess(
        isActive ? 'Usuario reactivado' : 'Usuario desactivado',
        isActive
          ? `"${response.data.username}" volvió a estar activo.`
          : `"${response.data.username}" fue desactivado.`,
      );
      return response.data;
    } catch (error) {
      notifyError(
        error,
        isActive
          ? 'No se pudo reactivar el usuario.'
          : 'No se pudo desactivar el usuario.',
      );
      throw error;
    }
  },
};
