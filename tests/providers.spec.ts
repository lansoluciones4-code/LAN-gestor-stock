import { test, expect } from '@playwright/test';
//How to run
/*
Instalar playwright en la carpeta raiz del proyecto:      npm init playwright@latest

Ejecuta un archivo de pruebas específico en modo en todos los navegadores configurados:
                                                          npx playwright test tests/providers.spec.ts

Limita la ejecución de la prueba únicamente al motor de Google Chrome.
                                                          npx playwright test tests/providers.spec.ts --project=chromium

Ejecuta la prueba abriendo la ventana del navegador de forma visible para que veas qué está pasando.
                                                          npx playwright test tests/providers.spec.ts --headed

Muestra el reporte final en caso de éxito:                npx playwright show-report

Abre el navegador y la herramienta que graba tus clics y tipeos, transformándolos en código TypeScript.
                                                          npx playwright codegen http://localhost:3000
*/


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
    nombre: '', telefono: '', correo: '',
    erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio', 'El correo es obligatorio']
  },
  {
    descripcion: 'Debería requerir el nombre',
    nombre: '', telefono: '291 718-1273', correo: 'correo@ejemplo.com',
    erroresEsperados: ['El nombre debe tener al menos']
  },
  {
    descripcion: 'Debería requerir el teléfono',
    nombre: 'Proveedor de Prueba', telefono: '', correo: 'correo@ejemplo.com',
    erroresEsperados: ['El teléfono es obligatorio']
  },
  {
    descripcion: 'Debería requerir el correo',
    nombre: 'Proveedor de Prueba', telefono: '291 718-1273', correo: '',
    erroresEsperados: ['El correo es obligatorio']
  },
  {
    descripcion: 'Debería requerir nombre y teléfono',
    nombre: '', telefono: '', correo: 'correo@ejemplo.com',
    erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio']
  },
  {
    descripcion: 'Debería requerir nombre y correo',
    nombre: '', telefono: '291 718-1273', correo: '',
    erroresEsperados: ['El nombre debe tener al menos', 'El correo es obligatorio']
  },
  {
    descripcion: 'Debería requerir teléfono y correo',
    nombre: 'Proveedor de Prueba', telefono: '', correo: '',
    erroresEsperados: ['El teléfono es obligatorio', 'El correo es obligatorio']
  },
  {
    descripcion: 'Debería respetar los límites de longitud máxima de los campos',
    nombre: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadosaaaaa', 
    telefono: '1234567891234567890012345678901', 
    correo: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsper@algo.com',
    erroresEsperados: ['Nombre demasiado largo', 'Número de teléfono demasiado', 'Too big: expected string to']
  }
];

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  await page.goto('http://localhost:3000/proveedores');
});

test.describe.parallel('Gestión de Proveedores: Validaciones y Lógica', () => {

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
      const inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
      const inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
      const btnAgregar = page.getByRole('button', { name: 'Agregar Proveedor' });
      const btnRegistrar = page.getByRole('button', { name: 'Registrar Proveedor' });

      await page.getByRole('link', { name: 'Proveedores' }).click();
      await btnAgregar.click();

      if (caso.nombre) await inputNombre.fill(caso.nombre);
      if (caso.telefono) await inputTelefono.fill(caso.telefono);
      if (caso.correo) await inputCorreo.fill(caso.correo);

      await btnRegistrar.click();

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      // Verificamos que el formulario siga abierto tras el reintento fallido de creación
      await expect(btnRegistrar).toBeVisible();
    });
  }

  test('Debería transitar correctamente el ciclo de desactivación, reactivación y eliminación', async ({ page }) => {
    const nombre = 'ProveedorDesactivable';
    const telefono = '291 718-1273';
    const correo = 'correoEjemplo@correo.com';

    const inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    const inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    const inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
    const btnAgregar = page.getByRole('button', { name: 'Agregar Proveedor' });
    const btnRegistrar = page.getByRole('button', { name: 'Registrar Proveedor' });
    const btnVerInactivos = page.getByText('Ver Inactivos');

    // Módulo de Creación
    await page.getByRole('link', { name: 'Proveedores' }).click();
    await btnAgregar.click();
    await inputNombre.fill(nombre);
    await inputTelefono.fill(telefono);
    await inputCorreo.fill(correo);
    await btnRegistrar.click();

    // Desactivación Lógica
    const filaActiva = page.getByRole('row').filter({ hasText: nombre });
    await filaActiva.getByRole('button', { name: 'Desactivar' }).click();
    await expect(filaActiva).toBeHidden({ timeout: 15000 });

    // Verificación en Inactivos y Reactivación
    await btnVerInactivos.click();
    const filaInactiva = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });
    
    await filaInactiva.getByRole('button', { name: 'Activar' }).click();
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });

    // Eliminación Definitiva desde Inactivos (estando ya reactivado)
    await btnVerInactivos.click();
    const filaReactivada = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaReactivada).toBeVisible({ timeout: 15000 });
    
    await filaReactivada.getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('button', { name: 'Desvincular' }).click();
    await expect(filaReactivada).toBeHidden({ timeout: 15000 });
  });
});

test.describe.serial('Gestión de Proveedores: Ciclo de Vida CRUD', () => {

  const proveedorTest = {
    nombreOriginal: 'ProveedorCualquiera',
    telefonoOriginal: '291 718-1273',
    correoOriginal: 'correoEjemplo@correo.com',
    nombreEditado: 'ProveedorEditadoNombre',
    telefonoEditado: '291 999-9999',
    correoEditado: 'editado@correo.com'
  };

  test('Debería crear un nuevo proveedor exitosamente', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    const inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    const inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
    const btnAgregar = page.getByRole('button', { name: 'Agregar Proveedor' });
    const btnRegistrar = page.getByRole('button', { name: 'Registrar Proveedor' });

    await btnAgregar.click();
    await inputNombre.fill(proveedorTest.nombreOriginal);
    await inputTelefono.fill(proveedorTest.telefonoOriginal);
    await inputCorreo.fill(proveedorTest.correoOriginal);
    await btnRegistrar.click();

    await expect(page.getByText(proveedorTest.nombreOriginal)).toBeVisible();
  });

  test('Debería listar únicamente al proveedor creado al utilizar la búsqueda', async ({ page }) => {
    const inputBusqueda = page.getByRole('textbox', { name: 'Buscar distribuidor por' });
    
    await inputBusqueda.fill(proveedorTest.nombreOriginal);
    await expect(page.getByText(proveedorTest.nombreOriginal)).toBeVisible();
    
    // Contamos cabecera + 1 fila de resultados correspondiente a la búsqueda
    const filasTabla = page.getByRole('row');
    await expect(filasTabla).toHaveCount(2); 
  });

  test('Debería editar exitosamente los datos del proveedor previamente creado', async ({ page }) => {
    const filaOriginal = page.getByRole('row').filter({ hasText: proveedorTest.nombreOriginal });
    const btnEditar = filaOriginal.getByRole('button', { name: 'Editar' });
    
    const inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    const inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    const inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
    const btnActualizar = page.getByRole('button', { name: 'Actualizar Firma' });

    await btnEditar.click();

    await inputNombre.fill(proveedorTest.nombreEditado);
    await inputTelefono.fill(proveedorTest.telefonoEditado);
    await inputCorreo.fill(proveedorTest.correoEditado);
    await btnActualizar.click();

    // Verificamos la desaparición de los datos antiguos
    await expect(page.getByText(proveedorTest.nombreOriginal)).toBeHidden();
    await expect(page.getByRole('cell', { name: proveedorTest.telefonoOriginal })).toBeHidden();
    await expect(page.getByRole('cell', { name: proveedorTest.correoOriginal })).toBeHidden();

    // Verificamos la presencia de los datos actualizados
    await expect(page.getByText(proveedorTest.nombreEditado)).toBeVisible();
    await expect(page.getByText(proveedorTest.telefonoEditado)).toBeVisible();
    await expect(page.getByText(proveedorTest.correoEditado)).toBeVisible();
  });

  test('Debería eliminar físicamente al proveedor editado', async ({ page }) => {
    const filaProveedor = page.getByRole('row').filter({ hasText: proveedorTest.nombreEditado });
    const btnEliminar = filaProveedor.getByRole('button', { name: 'Eliminar' });
    const btnConfirmarDesvinculacion = page.getByRole('button', { name: 'Desvincular' });

    await btnEliminar.click();
    await btnConfirmarDesvinculacion.click();

    await expect(filaProveedor).toBeHidden({ timeout: 15000 });
  });

});
