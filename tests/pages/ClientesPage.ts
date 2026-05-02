import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { customers } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

export class ClientesPage {
  static readonly URL = '/clientes';

  readonly page: Page;

  // =========================================================================
  // UI
  // =========================================================================
  static readonly UI = {
    BTN_REGISTRAR: 'Guardar Cliente',
    BTN_EDITAR: 'Editar Profile',
    BTN_ACTUALIZAR: 'Actualizar Ficha',
    BTN_DESACTIVAR: 'Desactivar',
    BTN_VER_INACTIVOS: 'Ver Inactivos',
    BTN_ACTIVAR: 'Activar',
    BTN_CANCELAR: 'Cancelar',
  } as const;

  // =========================================================================
  // Locators
  // =========================================================================
  readonly inputNombre: Locator;
  readonly inputTelefono: Locator;
  readonly inputCorreo: Locator;
  readonly inputDni: Locator;
  readonly inputBusqueda: Locator;

  readonly btnAgregarNuevo: Locator;
  readonly btnRegistrar: Locator;
  readonly btnActualizar: Locator;
  readonly btnVerInactivos: Locator;
  readonly btnCancelar: Locator;
  readonly btnSincronizar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.inputNombre = page.getByRole('textbox', { name: 'Ej: Carlos Pérez Martínez' });
    this.inputTelefono = page.getByRole('textbox', { name: '+54 9 11 9876-' });
    this.inputCorreo = page.getByRole('textbox', { name: 'cliente@correo.com' });
    this.inputDni = page.getByRole('textbox', { name: 'Ej: 35.123.456 o 20-35123456-' });
    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });

    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar);
    this.btnRegistrar = page.getByRole('button', { name: ClientesPage.UI.BTN_REGISTRAR, exact: true });
    this.btnActualizar = page.getByRole('button', { name: ClientesPage.UI.BTN_ACTUALIZAR, exact: true });
    this.btnCancelar = page.getByRole('button', { name: ClientesPage.UI.BTN_CANCELAR, exact: true });
    this.btnVerInactivos = page.getByTestId(TEST_IDS.general.btnVerOcultos).filter({ visible: true });
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar);
  }

  // =========================================================================
  // Acciones
  // =========================================================================

  async goto() {
    await this.page.goto(ClientesPage.URL);
    await expect(this.page).toHaveURL(new RegExp(ClientesPage.URL));
  }

  async buscarCliente(término: string) {
    await this.inputBusqueda.fill(término);
    await this.hacerScrollHastaVisible(término);
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

  async crearCliente(nombre?: string, telefono?: string, correo?: string, dni?: string) {
    await this.btnAgregarNuevo.click();

    if (nombre !== undefined) await this.inputNombre.fill(nombre);
    if (telefono !== undefined) await this.inputTelefono.fill(telefono);
    if (correo !== undefined) await this.inputCorreo.fill(correo);
    if (dni !== undefined) await this.inputDni.fill(dni);

    await this.btnRegistrar.click();
  }

  async editarCliente(términoBúsqueda: string, nuevoNombre?: string, nuevoTelefono?: string, nuevoCorreo?: string, nuevoDni?: string) {
    await this.buscarCliente(términoBúsqueda);
    const fila = this.obtenerFilaPorNombre(términoBúsqueda);
    await fila.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    if (nuevoNombre !== undefined) await this.inputNombre.fill(nuevoNombre);
    if (nuevoTelefono !== undefined) await this.inputTelefono.fill(nuevoTelefono);
    if (nuevoCorreo !== undefined) await this.inputCorreo.fill(nuevoCorreo);
    if (nuevoDni !== undefined) await this.inputDni.fill(nuevoDni);

    await this.btnActualizar.click();
    await this.borrarBusqueda();
  }

  async desactivarCliente(término: string) {
    await this.buscarCliente(término);
    const fila = this.obtenerFilaPorNombre(término);
    await fila.getByRole('button', { name: ClientesPage.UI.BTN_DESACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async activarCliente(término: string) {
    await this.buscarCliente(término);
    const fila = this.obtenerFilaPorNombre(término);
    await fila.getByRole('button', { name: ClientesPage.UI.BTN_ACTIVAR, exact: true }).click();
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

  async inyectarClienteEfimero(): Promise<{ nombre: string; dni: string; tel: string; email: string }> {
    const hash = Math.random().toString(36).substring(2, 8);
    const nombre = `Cliente Efímero ${hash}`;
    const dni = Math.floor(10000000 + Math.random() * 90000000).toString();
    const tel = '1234567890';
    const email = `test${Date.now()}@test.com`;
    await db.insert(customers).values({
      name: nombre,
      phone: tel,
      email: email,
      documentNumber: dni,
      isActive: true,
    });

    await this.sincronizar();
    return { nombre, dni, tel, email };
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
