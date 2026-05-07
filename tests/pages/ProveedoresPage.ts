import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { providers } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

export class ProveedoresPage {
  static readonly URL = '/proveedores';

  readonly page: Page;

  // =========================================================================
  // UI
  // =========================================================================
  static readonly UI = {
    BTN_REGISTRAR: 'Registrar Proveedor',
    BTN_EDITAR: 'Editar',
    BTN_ACTUALIZAR: 'Actualizar Firma',
    BTN_DESACTIVAR: 'Desactivar',
    BTN_VER_INACTIVOS: 'Ver Inactivos',
    BTN_ACTIVAR: 'Activar',
    BTN_ELIMINAR: 'Eliminar',
    BTN_DESVINCULAR: 'Desvincular',
    BTN_CANCELAR: 'Cancelar',
  } as const;

  // =========================================================================
  // Locators
  // =========================================================================
  readonly inputNombre: Locator;
  readonly inputTelefono: Locator;
  readonly inputCorreo: Locator;
  readonly inputBusqueda: Locator;

  readonly btnAgregarNuevo: Locator;
  readonly btnRegistrar: Locator;
  readonly btnActualizar: Locator;
  readonly btnVerInactivos: Locator;
  readonly btnCancelar: Locator;
  readonly btnDesvincular: Locator;
  readonly btnSincronizar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.inputNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    this.inputTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    this.inputCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });

    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar);
    this.btnRegistrar = page.getByRole('button', { name: ProveedoresPage.UI.BTN_REGISTRAR, exact: true });
    this.btnActualizar = page.getByRole('button', { name: ProveedoresPage.UI.BTN_ACTUALIZAR, exact: true });
    this.btnCancelar = page.getByRole('button', { name: ProveedoresPage.UI.BTN_CANCELAR, exact: true });
    this.btnVerInactivos = page.getByTestId(TEST_IDS.general.btnVerOcultos).filter({ visible: true });
    this.btnDesvincular = page.getByRole('button', { name: ProveedoresPage.UI.BTN_DESVINCULAR, exact: true });
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar);
  }

  // =========================================================================
  // Acciones
  // =========================================================================

  async goto() {
    await this.page.goto(ProveedoresPage.URL);
    await expect(this.page).toHaveURL(new RegExp(ProveedoresPage.URL));
  }

  async buscarProveedor(nombre: string) {
    await this.inputBusqueda.fill(nombre);
    await this.hacerScrollHastaVisible(nombre);
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
      await this.page.waitForTimeout(50);
      intentos++;
    }
  }

  async borrarBusqueda() {
    await this.inputBusqueda.fill('');
  }

  async crearProveedor(nombre?: string, telefono?: string, correo?: string) {
    await this.btnAgregarNuevo.click();
    if (nombre !== undefined) await this.inputNombre.fill(nombre);
    if (telefono !== undefined) await this.inputTelefono.fill(telefono);
    if (correo !== undefined) await this.inputCorreo.fill(correo);
    await this.btnRegistrar.click();
  }

  async editarProveedor(nombreOriginal: string, nuevoNombre?: string, nuevoTelefono?: string, nuevoCorreo?: string) {
    await this.buscarProveedor(nombreOriginal);
    const fila = this.obtenerFilaPorNombre(nombreOriginal);
    await fila.getByRole('button', { name: ProveedoresPage.UI.BTN_EDITAR, exact: true }).click();

    if (nuevoNombre !== undefined) await this.inputNombre.fill(nuevoNombre);
    if (nuevoTelefono !== undefined) await this.inputTelefono.fill(nuevoTelefono);
    if (nuevoCorreo !== undefined) await this.inputCorreo.fill(nuevoCorreo);

    await this.btnActualizar.click();
    await this.borrarBusqueda();
  }

  async desactivarProveedor(nombre: string) {
    await this.buscarProveedor(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: ProveedoresPage.UI.BTN_DESACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async activarProveedor(nombre: string) {
    await this.buscarProveedor(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: ProveedoresPage.UI.BTN_ACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async eliminarProveedor(nombre: string) {
    await this.buscarProveedor(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: ProveedoresPage.UI.BTN_ELIMINAR, exact: true }).click();
    await this.btnDesvincular.click();
    await this.borrarBusqueda();
  }

  async verInactivos() {
    await this.btnVerInactivos.click();
  }

  async sincronizar() {
    await this.btnSincronizar.click();
  }

  async inyectarProveedorEfimero(): Promise<string> {
    const hash = Math.random().toString(36).substring(2, 8);
    const nombre = `Proveedor Efímero ${hash}`;
    await db.insert(providers).values({
      name: nombre,
      phone: '1234567890',
      email: `test${Date.now()}@test.com`,
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
