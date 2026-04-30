import { test, expect } from '@playwright/test';
import { EquiposPage } from './pages/EquiposPage';
import { MESSAGES } from '@/config/messages';

// =========================================================================
// VARIABLES PARA COMPLETAR POR EL USUARIO
// =========================================================================
const UI = {
  // Placeholders / Labels
  NOMBRE: 'Ej: iPhone 15 Pro Max', // Ej: 'Nombre del equipo'

  // Botones y Búsqueda
  BTN_AGREGAR_NUEVO: 'Agregar Categoría', // Ej: 'Agregar Equipo'
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
    erroresEsperados: ['El nombre es obligatorio'],
  },
  {
    descripcion: 'Debería respetar el límite máximo',
    nombre: 'e'.repeat(101),
    erroresEsperados: ['El nombre no puede exceder'],
  },
];

test.beforeEach(async ({ page }) => {
  const equiposPage = new EquiposPage(page);
  await equiposPage.goto();
});

test.describe.parallel('Gestión de Equipos: Validaciones y Lógica', () => {
  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const equiposPage = new EquiposPage(page);

      await equiposPage.crearEquipo(caso.nombre);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
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

  test('Debería transitar correctamente el ciclo de desactivación y reactivación', async ({ page }) => {
    const equiposPage = new EquiposPage(page);

    const nombre = await equiposPage.inyectarEquipoEfimero();

    await equiposPage.desactivarEquipo(nombre);
    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();

    await equiposPage.verInactivos();
    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();

    await equiposPage.activarEquipo(nombre);
    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();
  });

  test('Debería eliminar correctamente un equipo', async ({ page }) => {
    const equiposPage = new EquiposPage(page);
    const nombre = await equiposPage.inyectarEquipoEfimero();

    await equiposPage.buscarEquipo(nombre);
    await equiposPage.eliminarEquipo(nombre);
    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();
  });

  test('Debería intentar crear dos equipos iguales', async ({ page }) => {
    const equiposPage = new EquiposPage(page);
    const nombre = await equiposPage.inyectarEquipoEfimero();
    const errorTexto = MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION;

    await equiposPage.crearEquipo(nombre);
    await expect(page.getByText(errorTexto)).toBeVisible();
  });

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación edición: ${caso.descripcion}`, async ({ page }) => {
      const equiposPage = new EquiposPage(page);
      const nombre = await equiposPage.inyectarEquipoEfimero();

      await equiposPage.editarEquipo(nombre, caso.nombre);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Debería crear un nuevo equipo', async ({ page }) => {
    const equiposPage = new EquiposPage(page);
    const nombre = 'Equipo nuevo';

    await equiposPage.crearEquipo(nombre);

    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const equiposPage = new EquiposPage(page);
    const nombreViejo = await equiposPage.inyectarEquipoEfimero();
    const nombreNuevo = 'Equipo editado';

    await equiposPage.editarEquipo(nombreViejo, nombreNuevo);

    await equiposPage.buscarEquipo(nombreNuevo);
    await expect(page.getByText(nombreNuevo, { exact: true })).toBeVisible();
  });

  test('Debería eliminar físicamente al equipo', async ({ page }) => {
    const equiposPage = new EquiposPage(page);
    const nombre = await equiposPage.inyectarEquipoEfimero();

    await equiposPage.eliminarEquipo(nombre);
    await equiposPage.buscarEquipo(nombre);
    await expect(page.getByText(nombre, { exact: true })).toBeHidden();
  });
});
