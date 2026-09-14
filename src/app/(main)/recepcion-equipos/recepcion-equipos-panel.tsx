'use client';

import { useMemo, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDeviceIntakeStore } from '@/features/device-intake/store/device-intake.store';
import {
  fetchDeviceIntakes,
  createDeviceIntakeAction,
  updateDeviceIntakeAction,
  deleteDeviceIntakeAction,
  toggleDeviceIntakeActiveAction,
} from '@/features/device-intake/actions/device-intake.actions';
import { type DeviceIntakeDef, type DeviceIntakeInput, type DeviceIntakeUpdateInput } from '@/features/device-intake/domain/device-intake.schema';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Button } from '@/components/ui/button';
import { getDeviceIntakeColumns } from '@/config/tables/device-intake-columns';
import { renderDeviceIntakeCard } from '@/config/cards/device-intake-card';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { invalidateAllCaches } from '@/stores';
import { DeviceIntakeFormModal } from '@/features/device-intake/ui/components/device-intake-form-modal';
import { DeviceIntakeDiagnosisModal } from '@/features/device-intake/ui/components/device-intake-diagnosis-modal';
import { DeviceIntakePhotosManager } from '@/features/device-intake/ui/components/device-intake-photos-manager';
import { DeviceIntakePrintView } from '@/features/device-intake/ui/components/device-intake-print-view';
import { DeviceIntakeDiagnosisPrintView } from '@/features/device-intake/ui/components/device-intake-diagnosis-print-view';

export function RecepcionEquiposPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [showInactive, setShowInactive] = useState(false);
  const { deviceIntakes, setDeviceIntakes, isLoaded } = useDeviceIntakeStore();

  const [view, setView] = useState<'list' | 'print' | 'diagnosis-print'>('list');
  const [selectedForPrint, setSelectedForPrint] = useState<DeviceIntakeDef | null>(null);

  const [diagnosisTarget, setDiagnosisTarget] = useState<DeviceIntakeDef | null>(null);
  const [photosTarget, setPhotosTarget] = useState<DeviceIntakeDef | null>(null);

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<DeviceIntakeDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<DeviceIntakeDef, DeviceIntakeInput, DeviceIntakeUpdateInput>({
    handlers: {
      fetchData: fetchDeviceIntakes,
      createAction: createDeviceIntakeAction,
      updateAction: updateDeviceIntakeAction,
      deleteAction: deleteDeviceIntakeAction,
      toggleActiveAction: toggleDeviceIntakeActiveAction,
    },
    setStoreData: setDeviceIntakes,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
  });

  const { initialLoading } = useAutoSync({ isLoaded, sync: () => fetchDeviceIntakes().then(setDeviceIntakes) });

  const filteredDeviceIntakes = useMemo(
    () =>
      deviceIntakes.filter((i) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(i.customer?.name), normalizeForSearch(i.description), normalizeForSearch(i.receivedByName)].join(' ');
        return terms.every((w) => text.includes(w)) && (showInactive || i.isActive);
      }),
    [deviceIntakes, search, showInactive]
  );

  const refreshAfterDiagnosis = async () => {
    invalidateAllCaches();
    const resp = await fetchDeviceIntakes();
    setDeviceIntakes(resp);
    showGlobalMessage('success', 'Diagnóstico final guardado exitosamente');
  };

  const columns = getDeviceIntakeColumns({
    role,
    onPhotos: setPhotosTarget,
    onPrint: (item) => {
      setSelectedForPrint(item);
      setView('print');
    },
    onPrintDiagnosis: (item) => {
      setSelectedForPrint(item);
      setView('diagnosis-print');
    },
    onDiagnose: setDiagnosisTarget,
    onEdit: openFormModal,
    onToggleActive: handleToggleActive,
    onDelete: setItemToDelete,
  });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  if (view === 'print' && selectedForPrint) {
    return (
      <DeviceIntakePrintView
        intake={selectedForPrint}
        onClose={() => {
          setSelectedForPrint(null);
          setView('list');
        }}
      />
    );
  }

  if (view === 'diagnosis-print' && selectedForPrint) {
    return (
      <DeviceIntakeDiagnosisPrintView
        intake={selectedForPrint}
        onClose={() => {
          setSelectedForPrint(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <div className='flex flex-col flex-1 h-full outline-none' tabIndex={-1}>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar por cliente, descripción o quién recibió'
        searchPlaceholderMobile='Buscar recepciones...'
        filters={<ToggleFilter id='showInactiveDeviceIntakes' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' />}
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none'>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button variant='primary' onClick={() => openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base'>
            <span className='hidden sm:inline'>Nuevo Equipo</span>
            <span className='sm:hidden'>Nuevo</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredDeviceIntakes}
        isLoading={isPending}
        emptyMessage='No se han encontrado recepciones de equipo.'
        renderCard={renderDeviceIntakeCard({
          role,
          onPhotos: setPhotosTarget,
          onPrint: (item) => {
            setSelectedForPrint(item);
            setView('print');
          },
          onPrintDiagnosis: (item) => {
            setSelectedForPrint(item);
            setView('diagnosis-print');
          },
          onDiagnose: setDiagnosisTarget,
          onEdit: openFormModal,
          onToggleActive: handleToggleActive,
          onDelete: setItemToDelete,
        })}
      />

      <DeviceIntakeFormModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        onSubmit={handleEditSubmit}
        editingItem={editingItem}
        serverError={serverError}
        isPending={isPending}
      />

      <DeviceIntakeDiagnosisModal
        intake={diagnosisTarget}
        isOpen={!!diagnosisTarget}
        onClose={() => setDiagnosisTarget(null)}
        onSuccess={refreshAfterDiagnosis}
      />

      <DeviceIntakePhotosManager
        deviceIntakeId={photosTarget?.id ?? null}
        isOpen={!!photosTarget}
        onClose={() => setPhotosTarget(null)}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Recepción de Equipo'
        description='Esta acción es permanente y eliminará el registro completo, incluidas sus fotos.'
        submitLabel='Eliminar'
        isPending={isPending}
      />
    </div>
  );
}
