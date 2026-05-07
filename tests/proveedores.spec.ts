import { test, expect } from '@playwright/test';
import { ProveedoresPage } from './pages/ProveedoresPage';
import { ProductosPage } from './pages/ProductosPage';

/**
 * Suite de Pruebas E2E: Gestión de Proveedores
 *
 * Este archivo de pruebas verifica la gestión de proveedores, asegurando
 * que la base de datos retorne a su estado original al finalizar.
 *
 * Cobertura de pruebas:
 * - Autenticación y navegación inicial.
 * - Validaciones de formulario (campos requeridos, límites de longitud).
 * - Ciclo de vida lógico (desactivación y reactivación).
 * - Ciclo de vida físico (creación, edición y eliminación).
 */

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir todos los campos',
    nombre: '',
    telefono: '',
    correo: '',
    erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio', 'Formato de correo electrónico'],
  },
  {
    descripcion: 'Debería requerir el nombre',
    nombre: '',
    telefono: '291 7181273',
    correo: 'correo@ejemplo.com',
    erroresEsperados: ['El nombre debe tener al menos'],
  },
  {
    descripcion: 'Debería requerir el teléfono',
    nombre: 'Proveedor de Prueba',
    telefono: '',
    correo: 'correo@ejemplo.com',
    erroresEsperados: ['El teléfono es obligatorio'],
  },
  {
    descripcion: 'Debería requerir el correo',
    nombre: 'Proveedor de Prueba',
    telefono: '291 7181273',
    correo: '',
    erroresEsperados: ['Formato de correo electrónico'],
  },
  {
    descripcion: 'Debería requerir nombre y teléfono',
    nombre: '',
    telefono: '',
    correo: 'correo@ejemplo.com',
    erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio'],
  },
  {
    descripcion: 'Debería requerir nombre y correo',
    nombre: '',
    telefono: '291 7181273',
    correo: '',
    erroresEsperados: ['El nombre debe tener al menos', 'Formato de correo electrónico'],
  },
  {
    descripcion: 'Debería requerir teléfono y correo',
    nombre: 'Proveedor de Prueba',
    telefono: '',
    correo: '',
    erroresEsperados: ['El teléfono es obligatorio', 'Formato de correo electrónico'],
  },
  {
    descripcion: 'Debería respetar los límites de longitud máxima de los campos',
    nombre: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadosaaaaa',
    telefono: '1234567891234567890012345678901',
    correo: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsper@algo.com',
    erroresEsperados: ['Nombre demasiado largo', 'Número de teléfono demasiado', 'El correo electrónico es'],
  },
];

test.beforeEach(async ({ page }) => {
  const proveedoresPage = new ProveedoresPage(page);
  await proveedoresPage.goto();
});

test.describe.parallel('Gestión de Proveedores: Validaciones y Lógica', () => {
  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const proveedoresPage = new ProveedoresPage(page);

      await proveedoresPage.crearProveedor(caso.nombre, caso.telefono, caso.correo);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    const inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    const inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });

    const btnAgregar = page.getByRole('button', { name: 'Agregar Proveedor' });
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });

    await page.getByRole('link', { name: 'Proveedores' }).click(); // Optional routing if not already on the page, but earlier tests assume we are
    await btnAgregar.click();
    await inputNombre.fill('Wipe Provider');
    await inputTelefono.fill('123456789');
    await inputCorreo.fill('wipe@provider.com');

    await btnCancelar.click();

    await btnAgregar.click();
    await expect(inputNombre).toHaveValue('');
    await expect(inputTelefono).toHaveValue('');
    await expect(inputCorreo).toHaveValue('');
  });

  test('Debería transitar correctamente el ciclo de desactivación y reactivación', async ({ page }) => {
    const proveedoresPage = new ProveedoresPage(page);
    const nombre = await proveedoresPage.inyectarProveedorEfimero();

    // Desactivación Lógica
    await proveedoresPage.desactivarProveedor(nombre);
    await proveedoresPage.buscarProveedor(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();

    // Verificación en Inactivos y Reactivación
    await proveedoresPage.verInactivos();
    await proveedoresPage.activarProveedor(nombre);
    await proveedoresPage.buscarProveedor(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();
  });

  test('Debería transitar la eliminación', async ({ page }) => {
    const proveedoresPage = new ProveedoresPage(page);
    const nombre = await proveedoresPage.inyectarProveedorEfimero();

    await proveedoresPage.eliminarProveedor(nombre);
    await proveedoresPage.buscarProveedor(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();
  });

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación edición: ${caso.descripcion}`, async ({ page }) => {
      const proveedoresPage = new ProveedoresPage(page);
      const nombre = await proveedoresPage.inyectarProveedorEfimero();
      await proveedoresPage.editarProveedor(nombre, caso.nombre, caso.telefono, caso.correo);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Debería crear un nuevo proveedor exitosamente', async ({ page }) => {
    const proveedoresPage = new ProveedoresPage(page);
    const proveedorTest = {
      nombre: 'ProveedorCualquiera',
      telefono: '291 7181273',
      correo: 'correoEjemplo@correo.com',
    };

    await proveedoresPage.crearProveedor(proveedorTest.nombre, proveedorTest.telefono, proveedorTest.correo);
    await proveedoresPage.buscarProveedor(proveedorTest.nombre);
    await expect(page.getByText(proveedorTest.nombre, { exact: true })).toBeVisible();
  });

  test('Debería editar exitosamente los datos de un proveedor', async ({ page }) => {
    const proveedoresPage = new ProveedoresPage(page);
    const nombre = await proveedoresPage.inyectarProveedorEfimero();
    const proveedorTest = {
      nombreOriginal: nombre,
      nombreEditado: nombre + nombre,
      telefonoEditado: '291 9999999',
      correoEditado: 'editado@correo.com',
    };

    await proveedoresPage.editarProveedor(proveedorTest.nombreOriginal, proveedorTest.nombreEditado, proveedorTest.telefonoEditado, proveedorTest.correoEditado);

    await proveedoresPage.buscarProveedor(proveedorTest.nombreOriginal);
    await expect(page.getByText(proveedorTest.nombreOriginal, { exact: true })).toBeHidden();
    await proveedoresPage.buscarProveedor(proveedorTest.nombreEditado);
    await expect(page.getByText(proveedorTest.nombreEditado, { exact: true })).toBeVisible();
  });

  test('Debería mostrar un error si se intenta eliminar un proveedor que está asociado a un producto', async ({ page }) => {
    const proveedoresPage = new ProveedoresPage(page);
    const productosPage = new ProductosPage(page);

    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    await proveedoresPage.goto();
    await proveedoresPage.eliminarProveedor(producto.proveedor);

    await expect(page.getByText('No se puede completar la operación porque existen registros relacionados.')).toBeVisible();

    await proveedoresPage.buscarProveedor(producto.proveedor);
    await expect(page.getByText(producto.proveedor, { exact: true })).toBeVisible();
  });
});
