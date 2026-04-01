/* eslint-disable space-before-function-paren */
import { test, expect } from '@playwright/test';


// =========================================================================
// VARIABLES PARA COMPLETAR POR EL USUARIO
// =========================================================================
const UI = {
  // Placeholders / Labels
  NOMBRE: 'Ej: iPhone 15 Pro Max', // Ej: 'Nombre del equipo'

  // Botones y Búsqueda
  BTN_AGREGAR_NUEVO: 'Agregar Equipo', // Ej: 'Agregar Equipo'
  BTN_REGISTRAR: 'Fichar Equipo', // Ej: 'Registrar Equipo' o 'Guardar'
  BUSQUEDA: 'Buscar modelos por marca', // Ej: 'Buscar equipo por'

  // Botones comunes
  BTN_EDITAR: 'Editar',
  BTN_ACTUALIZAR: 'Fichar Equipo',
  BTN_DESACTIVAR: 'Desactivar',
  BTN_VER_INACTIVOS: 'Inactivos',
  BTN_ACTIVAR: 'Activar',
  BTN_ELIMINAR: 'Eliminar',
  BTN_DESVINCULAR: 'Eliminar',
};

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir el nombre',
    nombre: '',
    erroresEsperados: ['El nombre es obligatorio'] // Según device.schema.ts
  },
  {
    descripcion: 'Debería respetar el límite máximo',
    nombre: 'e'.repeat(101),
    erroresEsperados: ['El nombre no puede exceder']
  }
];

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  await page.goto('http://localhost:3000/equipos');
});

test.describe.parallel('Gestión de Equipos: Validaciones y Lógica', () => {

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });

      const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
      const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

      await btnAgregar.click();

      if (caso.nombre) await inputNombre.fill(caso.nombre);

      await btnRegistrar.click();

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await expect(btnRegistrar).toBeVisible();
    });
  }

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });

    await btnAgregar.click();
    await inputNombre.fill('Test Wipe Eq');

    await btnCancelar.click();

    await btnAgregar.click();
    await expect(inputNombre).toHaveValue('');
  });

  test('Debería transitar correctamente el ciclo de desactivación, reactivación y eliminación', async ({ page }) => {
    const nombre = 'Equipo_Lógico';

    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });
    const btnVerInactivos = page.getByLabel(UI.BTN_VER_INACTIVOS);

    // Creación
    await btnAgregar.click();
    await inputNombre.fill(nombre);
    await btnRegistrar.click();

    // Desactivación
    const filaActiva = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaActiva).toBeVisible();
    await filaActiva.getByRole('button', { name: 'Desactivar' }).click();
    await expect(filaActiva).toBeHidden({ timeout: 5000 });

    // Reactivación
    await btnVerInactivos.click();
    const filaInactiva = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaInactiva).toBeVisible({ timeout: 5000 });

    await filaInactiva.getByRole('button', { name: UI.BTN_ACTIVAR }).click();
    await expect(filaInactiva).toBeVisible({ timeout: 5000 });

    // Eliminación
    await btnVerInactivos.click();
    const filaReactivada = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaReactivada).toBeVisible({ timeout: 5000 });

    await filaReactivada.getByRole('button', { name: UI.BTN_ELIMINAR }).click();
    await page.getByText('Eliminar', { exact: true }).click();
    await expect(filaReactivada).toBeHidden({ timeout: 5000 });
  });

  test('Debería intentar crear dos equipos iguales', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const equipoDoble = 'EquipoDoble';
    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });
    const errorTexto = 'Ya existe un equipo con ese nombre'; //TODO can change

    //Primera creacion
    await btnAgregar.click();
    await inputNombre.fill(equipoDoble);
    await btnRegistrar.click();

    await expect(page.getByText(equipoDoble)).toBeVisible();

    //Segunda creacion
    await btnAgregar.click();
    await inputNombre.fill(equipoDoble);
    await btnRegistrar.click();

    await expect(page.getByText(errorTexto)).toBeVisible();
    await expect(btnRegistrar).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    //Eliminacion del producto
    const fila = page.getByRole('row').filter({ hasText: equipoDoble });
    const btnEliminar = fila.getByRole('button', { name: UI.BTN_ELIMINAR });
    const btnConfirmar = page.getByText('Eliminar', { exact: true });

    await btnEliminar.click();
    await btnConfirmar.click();

    await expect(fila).toBeHidden({ timeout: 15000 });
  });
});

test.describe.serial('Gestión de Equipos: Ciclo de Vida CRUD', () => {

  const testEntity = {
    nombreOriginal: 'EquipoCrud',
    nombreEditado: 'EquipoEditado',
  };

  test('Debería crear un nuevo equipo', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

    await btnAgregar.click();
    await inputNombre.fill(testEntity.nombreOriginal);
    await btnRegistrar.click();

    await expect(page.getByText(testEntity.nombreOriginal)).toBeVisible();
  });

  test('Debería buscar listar únicamente al equipo creado', async ({ page }) => {
    const inputBusqueda = page.getByRole('textbox', { name: UI.BUSQUEDA });

    await inputBusqueda.fill(testEntity.nombreOriginal);
    await expect(page.getByText(testEntity.nombreOriginal)).toBeVisible();

    const filasTabla = page.getByRole('row');
    await expect(filasTabla).toHaveCount(2);
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const filaOriginal = page.getByRole('row').filter({ hasText: testEntity.nombreOriginal });
    const btnEditar = filaOriginal.getByRole('button', { name: UI.BTN_EDITAR });

    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const btnActualizar = page.getByRole('button', { name: UI.BTN_ACTUALIZAR });

    await btnEditar.click();
    await inputNombre.fill(testEntity.nombreEditado);
    await btnActualizar.click();

    await expect(page.getByText(testEntity.nombreOriginal)).toBeHidden();
    await expect(page.getByText(testEntity.nombreEditado)).toBeVisible();
  });

  test('Debería eliminar físicamente al equipo', async ({ page }) => {
    const fila = page.getByRole('row').filter({ hasText: testEntity.nombreEditado });
    const btnEliminar = fila.getByRole('button', { name: UI.BTN_ELIMINAR });
    const btnConfirmar = page.getByText('Eliminar', { exact: true });

    await btnEliminar.click();
    await btnConfirmar.click();

    await expect(fila).toBeHidden({ timeout: 15000 });
  });
});
