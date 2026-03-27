'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, X, Users, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { customerSchema, type CustomerInput, type CustomerDef } from '@/schemas/customer.schema';
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  fetchCustomers,
  toggleCustomerActiveAction,
} from '@/server/actions/customer.actions';
import { useAuthStore } from '@/stores/auth.store';

import { CustomerModal } from '@/components/modals/customer-modal';

export function CustomerManager({ initialData }: { initialData: CustomerDef[] }) {
  const role = useAuthStore((s) => s.user?.role);
  const [customers, setCustomers] = useState<CustomerDef[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showInactive, setShowInactive] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerDef | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const loadData = async (includeInactive = showInactive) => {
    startTransition(async () => {
      const resp = await fetchCustomers(includeInactive);
      setCustomers(resp);
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || 
           (c.email && c.email.toLowerCase().includes(term)) || 
           (c.phone && c.phone.toLowerCase().includes(term)) || 
           (c.documentNumber && c.documentNumber.toLowerCase().includes(term));
  });

  const openModal = (item?: CustomerDef) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSuccess = (data: any) => {
    setGlobalMessage({ type: 'success', text: editingItem ? 'Cliente actualizado' : 'Cliente registrado' });
    setTimeout(() => setGlobalMessage(null), 3000);
    loadData();
  };

  const handleToggleActive = async (item: CustomerDef) => {
    const nextStatus = !item.isActive;
    const result = await toggleCustomerActiveAction(item.id, nextStatus);
    if (!result.success) {
      setGlobalMessage({ type: 'error', text: result.message });
      setTimeout(() => setGlobalMessage(null), 4000);
    } else {
      setGlobalMessage({ type: 'success', text: result.message });
      setTimeout(() => setGlobalMessage(null), 3000);
      loadData();
    }
  };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar clientes por nombre, mail o DNI...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        
        <div className='flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0 h-10'>
          <input 
            type='checkbox' 
            id='showInactive' 
            checked={showInactive} 
            onChange={(e) => {
              const val = e.target.checked;
              setShowInactive(val);
              loadData(val);
            }} 
            className='w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300'
          />
          <label htmlFor='showInactive' className='text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none'>
            Ver Inactivos
          </label>
        </div>
        
        <button
          onClick={() => openModal()}
          className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
        >
          <Plus className='w-5 h-5 mr-2' />
          Registrar Cliente
        </button>
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg border text-sm shadow-sm ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {globalMessage.text}
        </div>
      )}

      <Table headers={['Nombre / Cliente', 'Documento', 'Teléfono', 'Email', 'Acciones']} isPending={isPending}>
        {filteredCustomers.map((c) => (
          <tr key={c.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
            <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100'>
              <div className='flex items-center gap-2'>
                {c.name}
                {!c.isActive && <span className='px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
              </div>
            </td>
            <td className='px-6 py-4 text-zinc-500 font-mono text-sm'>{c.documentNumber || '--'}</td>
            <td className='px-6 py-4 text-zinc-500 font-mono text-sm'>{c.phone || '--'}</td>
            <td className='px-6 py-4 text-zinc-500 text-sm'>{c.email || '--'}</td>
            <td className='px-6 py-4 flex gap-2 justify-end'>
              {role === 'admin' && (
                <button 
                  onClick={() => handleToggleActive(c)} 
                  className={`p-2 rounded-lg transition ${c.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'}`} 
                  title={c.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${c.isActive ? 'rotate-45' : ''}`} />
                </button>
              )}
              <button onClick={() => openModal(c)} className='p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 rounded-lg transition' title='Editar Profile'>
                <Edit className='w-4 h-4' />
              </button>
            </td>
          </tr>
        ))}
        {filteredCustomers.length === 0 && !isPending && (
          <tr><td colSpan={5} className='px-6 py-12 text-center text-zinc-400'>No se han encontrado clientes</td></tr>
        )}
      </Table>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        editingItem={editingItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
