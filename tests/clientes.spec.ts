import { test, expect } from '@playwright/test';
import { ClientesPage } from './pages/ClientesPage';
import { MESSAGES } from '@/config/messages';

// =========================================================================
// VARIABLES PARA COMPLETAR POR EL USUARIO
// Reemplaza los siguientes strings con los textos exactos de tu UI
// =========================================================================
const UI = {
  // Placeholders / Labels de los campos del formulario
  NOMBRE: 'Ej: Carlos Pérez Martínez',
  TELEFONO: '+54 9 11 9876-',
  CORREO: 'cliente@correo.com',
  DNI: 'Ej: 35.123.456 o 20-35123456-',

  // Botones y Búsqueda
  BTN_AGREGAR_NUEVO: 'Registrar Cliente', // Ej: 'Agregar Cliente'
  BTN_REGISTRAR: 'Guardar Cliente', // Ej: 'Registrar Cliente' o 'Guardar'
  BUSQUEDA: 'Buscar clientes por nombre,', // Ej: 'Buscar cliente por'

  // Botones comunes (copiados de providers, ajustar si necesario)
  BTN_EDITAR: 'Editar Profile',
  BTN_ACTUALIZAR: 'Actualizar Ficha', // Ajustar al botón de guardar edición
  BTN_DESACTIVAR: 'Desactivar',
  BTN_VER_INACTIVOS: 'Ver Inactivos',
  BTN_ACTIVAR: 'Activar',
};

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir campos obligatorios',
    nombre: 'Cliente Valido',
    telefono: '',
    correo: '',
    dni: '',
    erroresEsperados: ['El teléfono es obligatorio', 'Formato de correo electrónico', 'El DNI es obligatorio'],
  },
  {
    descripcion: 'Debería requerir un nombre de al menos 2 caracteres',
    nombre: 'a',
    telefono: '291 718-1273',
    correo: 'correo@ejemplo.com',
    dni: '12345678',
    erroresEsperados: ['El nombre debe tener al menos'],
  },
  {
    descripcion: 'Debería requerir un teléfono valido',
    nombre: 'ab',
    telefono: 'abc',
    correo: 'correo@ejemplo.com',
    dni: '12345678',
    erroresEsperados: ['Formato de teléfono inválido'],
  },
  {
    descripcion: 'Debería respetar límites máximos',
    // 101 caracteres -> falla nombre
    nombre: 'a'.repeat(101),
    // 31 caracteres -> falla teléfono
    telefono: '1234567890123456789012345678901',
    correo: 'largo'.repeat(21) + '@correo.com', // largo
    dni: '123456789012345678901', // 21 caracteres
    erroresEsperados: ['Nombre demasiado largo', 'Número de teléfono demasiado', 'El correo electrónico es', 'Documento demasiado largo'],
  },
];

test.beforeEach(async ({ page }) => {
  const clientesPage = new ClientesPage(page);
  await clientesPage.goto();
});

test.describe.parallel('Gestión de Clientes: Validaciones y Lógica', () => {
  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const clientesPage = new ClientesPage(page);
      await clientesPage.crearCliente(caso.nombre, caso.telefono, caso.correo, caso.dni);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Deberia fallar por DNI duplicado', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    const { nombre, dni, tel, email } = await clientesPage.inyectarClienteEfimero();
    const errorEsperado = MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION;

    await clientesPage.crearCliente(nombre, tel, email, dni);
    await expect(page.getByText(errorEsperado)).toBeVisible();
    await clientesPage.cancelarFormularioCreacion();

    const dni2 = dni + '-/';
    await clientesPage.crearCliente(nombre, tel, email, dni2);
    await expect(page.getByText(errorEsperado)).toBeVisible();
  });

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const inputTelefono = page.getByRole('textbox', { name: UI.TELEFONO });
    const inputCorreo = page.getByRole('textbox', { name: UI.CORREO });
    const inputDni = page.getByRole('textbox', { name: UI.DNI });

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });

    await btnAgregar.click();
    await inputNombre.fill('Test Wipe');
    await inputTelefono.fill('123456789');
    await inputCorreo.fill('test@wipe.com');
    await inputDni.fill('11111111');

    await btnCancelar.click();

    await btnAgregar.click();
    await expect(inputNombre).toHaveValue('');
    await expect(inputTelefono).toHaveValue('');
    await expect(inputCorreo).toHaveValue('');
    await expect(inputDni).toHaveValue('');
  });

  test('Debería transitar correctamente el ciclo de desactivación y reactivación', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    const { nombre } = await clientesPage.inyectarClienteEfimero();

    await clientesPage.buscarCliente(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();

    await clientesPage.desactivarCliente(nombre);
    await clientesPage.buscarCliente(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();

    await clientesPage.verInactivos();

    await clientesPage.buscarCliente(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();

    await clientesPage.activarCliente(nombre);
    await clientesPage.buscarCliente(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();
  });

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación edición: ${caso.descripcion}`, async ({ page }) => {
      const clientesPage = new ClientesPage(page);
      const { nombre } = await clientesPage.inyectarClienteEfimero();

      await clientesPage.buscarCliente(nombre);

      await clientesPage.editarCliente(nombre, caso.nombre, caso.telefono, caso.correo, caso.dni);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Debería desactivar a un cliente, crear uno con DNI identico y aseverar reactivacion con nuevos datos', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    const { nombre: nombreAntiguo, dni } = await clientesPage.inyectarClienteEfimero();

    const clienteBase = {
      nombre: 'Cliente ocupa dni desactivado',
      telefono: '291 1112222',
      correo: 'base@reactivado.com',
      dni: dni,
    };

    await clientesPage.buscarCliente(nombreAntiguo);
    await clientesPage.desactivarCliente(nombreAntiguo);
    await clientesPage.buscarCliente(nombreAntiguo);
    await expect(page.getByText(nombreAntiguo, { exact: true })).toBeHidden();

    await clientesPage.crearCliente(clienteBase.nombre, clienteBase.telefono, clienteBase.correo, clienteBase.dni);

    await clientesPage.buscarCliente(clienteBase.dni);
    await expect(page.getByText(clienteBase.dni, { exact: true })).toBeVisible();

    await clientesPage.verInactivos();
    await clientesPage.buscarCliente(nombreAntiguo);
    await expect(page.getByText(nombreAntiguo, { exact: true })).toBeHidden();
  });

  test('Debería crear un nuevo cliente exitosamente', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    const testEntity = {
      nombre: 'ClienteCualquiera',
      telefono: '291 718-1273',
      correo: 'correoEjemplo@correo.com',
      dni: '11111111',
      nombreEditado: 'ClienteEditado',
      telefonoEditado: '291 999-9999',
      correoEditado: 'editado@correo.com',
      dniEditado: '99999999',
    };

    await clientesPage.crearCliente(testEntity.nombre, testEntity.telefono, testEntity.correo, testEntity.dni);

    await clientesPage.buscarCliente(testEntity.nombre);
    await expect(page.getByText(testEntity.nombre, { exact: true })).toBeVisible();
  });

  test('Debería editar exitosamente los datos', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    const { nombre, dni } = await clientesPage.inyectarClienteEfimero();
    const testEntity = {
      nombreOriginal: nombre,
      nombreEditado: 'ClienteEditado',
      telefonoEditado: '291 999-9999',
      correoEditado: 'editado@correo.com',
      dniEditado: dni,
    };

    await clientesPage.editarCliente(testEntity.nombreOriginal, testEntity.nombreEditado, testEntity.telefonoEditado, testEntity.correoEditado, testEntity.dniEditado);

    await clientesPage.buscarCliente(testEntity.nombreOriginal);
    await expect(page.getByText(testEntity.nombreOriginal, { exact: true })).toBeHidden();

    await clientesPage.buscarCliente(testEntity.dniEditado);
    await expect(page.getByText(testEntity.dniEditado, { exact: true })).toBeVisible();
  });
});
