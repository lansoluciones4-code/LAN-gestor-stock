import { useCustomersStore } from './customers.store';
import { useDevicesStore } from './devices.store';
import { useLogsStore } from './logs.store';
import { useProductsStore } from './products.store';
import { useProvidersStore } from './providers.store';
import { useSalesStore } from './sales.store';
import { useStatsStore } from './stats.store';
import { useUsersStore } from './users.store';

/**
 * Centrally invalidates all data caches in the application.
 * Call this after any CRUD operation to ensure data consistency across stores.
 */
export const invalidateAllCaches = () => {
  useCustomersStore.getState().setLoaded(false);
  useDevicesStore.getState().setLoaded(false);
  useLogsStore.getState().setLoaded(false);
  useProductsStore.getState().setLoaded(false);
  useProvidersStore.getState().setLoaded(false);
  useSalesStore.getState().setLoaded(false);
  useStatsStore.getState().setLoaded(false);
  useUsersStore.getState().setLoaded(false);
};
