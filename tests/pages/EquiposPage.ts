import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { devices } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

export class EquiposPage {
  static readonly URL = '/categorias';

  readonly page: Page;

  // =========================================================================
  // UI
  // =========================================================================
  static readonly UI = {
    BTN_EDITAR: 'Editar Ficha',
    BTN_DESACTIVAR: 'Desactivar',
    BTN_VER_INACTIVOS: 'Ver Inactivos',
    BTN_ACTIVAR: 'Activar',
    BTN_ELIMINAR: 'Eliminar',
    BTN_CANCELAR: 'Cancelar',
    BTN_CONFIRMAR_ELIMINAR: 'Eliminar',
  } as const;

  // =========================================================================
  // Locators
  // =========================================================================
  readonly inputNombre: Locator;
  readonly inputBusqueda: Locator;

  readonly btnAgregarNuevo: Locator;
  readonly btnRegistrar: Locator;
  readonly btnActualizar: Locator;
  readonly btnVerInactivos: Locator;
  readonly btnCancelar: Locator;
  readonly btnSincronizar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.inputNombre = page.getByRole('textbox', { name: 'Ej: iPhone 15 Pro Max' });
    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });

    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar);
    this.btnRegistrar = page.getByTestId(TEST_IDS.general.btnSubmitModal);
    this.btnActualizar = page.getByTestId(TEST_IDS.general.btnSubmitModal);
    this.btnVerInactivos = page.getByTestId(TEST_IDS.general.btnVerOcultos).filter({ visible: true });
    this.btnCancelar = page.getByRole('button', { name: EquiposPage.UI.BTN_CANCELAR, exact: true });
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar);
  }

  // =========================================================================
  // Acciones
  // =========================================================================

  async goto() {
    await this.page.goto(EquiposPage.URL);
    await expect(this.page).toHaveURL(new RegExp(EquiposPage.URL));
  }

  async buscarEquipo(nombre: string) {
    await this.inputBusqueda.fill(nombre);
    await this.hacerScrollHastaVisible(nombre);
  }

  async borrarBusqueda() {
    await this.inputBusqueda.fill('');
  }

  async crearEquipo(nombre: string) {
    await this.btnAgregarNuevo.click();
    if (nombre) await this.inputNombre.fill(nombre);
    await this.btnRegistrar.click();
  }

  async hacerScrollHastaVisible(nombre: string) {
    const fila = this.obtenerFilaPorNombre(nombre);
    if (await fila.isVisible()) return;

    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.mouse.move(viewport.width / 2, viewport.height / 2);
    }

    const scroller = this.page.getByTestId('virtuoso-scroller').filter({ visible: true });
    if (await scroller.isVisible()) {
      await scroller.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await this.page.waitForTimeout(200);
    }

    let intentos = 0;
    while (!(await fila.isVisible()) && intentos < 30) {
      await this.page.mouse.wheel(0, -600);
      await this.page.waitForTimeout(150);
      intentos++;
    }
  }

  async editarEquipo(nombreOriginal: string, nuevoNombre: string) {
    await this.buscarEquipo(nombreOriginal);
    const fila = this.obtenerFilaPorNombre(nombreOriginal);
    await fila.getByRole('button', { name: EquiposPage.UI.BTN_EDITAR, exact: true }).click();

    await this.inputNombre.fill(nuevoNombre);
    await this.btnActualizar.click();
    await this.borrarBusqueda();
  }

  async desactivarEquipo(nombre: string) {
    await this.buscarEquipo(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: EquiposPage.UI.BTN_DESACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async activarEquipo(nombre: string) {
    await this.buscarEquipo(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: EquiposPage.UI.BTN_ACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async eliminarEquipo(nombre: string) {
    await this.buscarEquipo(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: EquiposPage.UI.BTN_ELIMINAR, exact: true }).click();
    await this.page.getByText(EquiposPage.UI.BTN_CONFIRMAR_ELIMINAR, { exact: true }).click();
    await this.borrarBusqueda();
  }

  async verInactivos() {
    await this.btnVerInactivos.click();
  }

  async sincronizar() {
    await this.btnSincronizar.click();
  }

  async abrirFormularioCreacion() {
    await this.btnAgregarNuevo.click();
  }

  async cancelarFormularioCreacion() {
    await this.btnCancelar.click();
  }

  async inyectarEquipoEfimero(): Promise<string> {
    const hash = Math.random().toString(36).substring(2, 8);
    const nombre = `Equipo Efímero ${hash}`;
    await db.insert(devices).values({
      name: nombre,
      isActive: true,
    });
    await this.sincronizar();
    return nombre;
  }

  // =========================================================================
  // Utilidades
  // =========================================================================

  obtenerFilaPorNombre(nombre: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(nombre, { exact: true }).or(this.page.getByTitle(nombre, { exact: true })),
    });
  }
}
