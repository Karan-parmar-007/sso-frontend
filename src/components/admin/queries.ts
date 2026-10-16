import { keepPreviousData, useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { AuditEventsResponse } from '@/lib/auditEvents'
import {
  ADMIN_KEYS,
  type AdminClient,
  type AdminRole,
  type AdminUsersResponse,
} from '@/components/admin/types'

export function useAdminClients() {
  return useQuery({
    queryKey: ADMIN_KEYS.clients,
    queryFn: async () => {
      const { data } = await apiClient.get<{ total_count: number; clients: AdminClient[] }>(
        '/admin/clients'
      )
      return data.clients
    },
  })
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ADMIN_KEYS.roles,
    queryFn: async () => {
      const { data } = await apiClient.get<{ total_count: number; roles: AdminRole[] }>(
        '/admin/roles'
      )
      return data.roles
    },
  })
}

export function useAdminUsers(page: number, pageSize: number) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(page),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUsersResponse>('/admin/users', {
        params: { page, page_size: pageSize },
      })
      return data
    },
  })
}

export function useAuditLog(params: {
  page: number
  pageSize: number
  event: string
  userId: string
}) {
  return useQuery({
    queryKey: [...ADMIN_KEYS.audit, params],
    placeholderData: keepPreviousData,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await apiClient.get<AuditEventsResponse>('/admin/audit', {
        params: {
          page: params.page,
          page_size: params.pageSize,
          event: params.event || undefined,
          user_id: params.userId || undefined,
        },
      })
      return data
    },
  })
}
