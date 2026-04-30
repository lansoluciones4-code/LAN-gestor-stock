import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useAuditStore } from '@/features/audit/store/audit.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { useSaleStore } from '@/features/sale/store/sale.store';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { useUserStore } from '@/features/user/store/user.store';

/**
 * Centrally invalidates all data caches in the application.
 * Call this after any CRUD operation to ensure data consistency across stores.
 */
export const invalidateAllCaches = () => {
  useCustomerStore.getState().setLoaded(false);
  useDeviceStore.getState().setLoaded(false);
  useAuditStore.getState().setLoaded(false);
  useProductStore.getState().setLoaded(false);
  useProviderStore.getState().setLoaded(false);
  useSaleStore.getState().setLoaded(false);
  useStatsStore.getState().setLoaded(false);
  useUserStore.getState().setLoaded(false);
};
