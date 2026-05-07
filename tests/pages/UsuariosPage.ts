import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { users } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

// Rutas y Constantes Globales expuestas
export const USER_ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export class UsuariosPage {
  static readonly ROLES = USER_ROLES;

  static readonly URL = '/usuarios';

  readonly page: Page;

  // =========================================================================
  // UI
  // =========================================================================

  static readonly UI = {
    BTN_EDITAR: 'Editar Seguridad',
    BTN_DESACTIVAR: 'Desactivar',
    BTN_ACTIVAR: 'Activar',
    BTN_ELIMINAR: 'Retirar Acceso',
  } as const;

  // =========================================================================
  // Locators
  // =========================================================================
  readonly inputUsername: Locator;
  readonly inputPassword: Locator;

  readonly inputEditPassword: Locator;

  readonly inputBusqueda: Locator;

  readonly btnAgregarNuevo: Locator;
  readonly btnRegistrar: Locator;
  readonly btnCancelar: Locator;
  readonly btnActualizar: Locator;
  readonly btnVerInactivos: Locator;
  readonly btnDesvincular: Locator;
  readonly comboRol: Locator;
  readonly btnSincronizar: Locator;

  constructor(page: Page) {
    this.page = page;

    // Inicialización explícita de locators en el constructor
    this.inputUsername = page.getByRole('textbox', { name: 'Ej: juan.perez' });
    this.inputPassword = page.getByLabel('Escribe una contraseña segura').or(page.getByPlaceholder('Escribe una contraseña segura'));
    this.inputEditPassword = page.getByLabel('******').or(page.getByPlaceholder('******'));
    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });

    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar);
    this.btnRegistrar = page.getByRole('button', { name: 'Confirmar Credencial', exact: true });
    this.btnCancelar = page.getByRole('button', { name: 'Cancelar', exact: true });
    this.btnActualizar = page.getByRole('button', { name: 'Confirmar Credencial', exact: true });
    this.btnVerInactivos = page.getByRole('checkbox', { name: 'Ver Inactivos', exact: true }).filter({ visible: true });
    this.btnDesvincular = page.getByRole('button', { name: 'Eliminar Acceso', exact: true });
    this.comboRol = page.getByRole('combobox');
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar);
  }

  // =========================================================================
  // Acciones (Comportamientos abstractos)
  // =========================================================================

  /**
   * Navega directamente a la página de usuarios
   */
  async goto() {
    await this.page.goto(UsuariosPage.URL);
    await expect(this.page).toHaveURL(new RegExp(UsuariosPage.URL));
  }

  /**
   * Realiza una búsqueda mediante el textbox
   */
  async buscarUsuario(nombre: string) {
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

  /**
   * Abre el modal y crea un nuevo usuario
   */
  async crearUsuario(username: string, password?: string, rol: UserRole = USER_ROLES.VENDEDOR) {
    await this.btnAgregarNuevo.click();
    if (username) await this.inputUsername.fill(username);
    if (password) await this.inputPassword.fill(password);
    await this.comboRol.selectOption(rol);
    await this.btnRegistrar.click();
  }

  /**
   * Busca un usuario en la tabla visible por exact-match y entra en edición
   */
  async editarUsuario(usernameOriginal: string, nuevoUsername?: string, nuevoPassword?: string, nuevoRol?: UserRole) {
    await this.buscarUsuario(usernameOriginal);
    const fila = this.obtenerFilaPorNombre(usernameOriginal);
    await fila.getByRole('button', { name: UsuariosPage.UI.BTN_EDITAR, exact: true }).click();

    if (nuevoUsername) await this.inputUsername.fill(nuevoUsername);
    if (nuevoPassword !== undefined) await this.inputEditPassword.fill(nuevoPassword);
    if (nuevoRol) await this.comboRol.selectOption(nuevoRol);

    await this.btnActualizar.click();

    await this.borrarBusqueda();
  }

  /**
   * Desactiva (soft-delete) a un usuario visible en pantalla
   */
  async desactivarUsuario(username: string) {
    await this.buscarUsuario(username);
    const fila = this.obtenerFilaPorNombre(username);
    await fila.getByRole('button', { name: UsuariosPage.UI.BTN_DESACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  /**
   * Restaura/activa a un usuario que actualmente figure en pantalla
   */
  async activarUsuario(username: string) {
    await this.buscarUsuario(username);
    const fila = this.obtenerFilaPorNombre(username);
    await fila.getByRole('button', { name: UsuariosPage.UI.BTN_ACTIVAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  /**
   * Elimina hardwaremente un usuario haciendo clic en "Retirar Acceso" y confirmando
   */
  async eliminarUsuario(username: string) {
    await this.buscarUsuario(username);
    const fila = this.obtenerFilaPorNombre(username);
    await fila.getByRole('button', { name: UsuariosPage.UI.BTN_ELIMINAR, exact: true }).click();
    await this.btnDesvincular.click();
    await this.borrarBusqueda();
  }

  /**
   * Togglea el botón superior para ver u ocultar inactivos
   */
  async verInactivos() {
    await this.btnVerInactivos.click();
  }

  async sincronizar() {
    await this.btnSincronizar.click();
  }

  async inyectarUsuarioEfimero(rol: UserRole = USER_ROLES.VENDEDOR): Promise<string> {
    const hash = Math.random().toString(36).substring(2, 8);
    const username = `test_user_${hash}`;
    await db.insert(users).values({
      username: username,
      passwordHash: 'dummy_hash',
      role: rol,
      isActive: true,
    });

    await this.sincronizar();
    return username;
  }

  // =========================================================================
  // Utilidades de Locators dinámicos
  // =========================================================================

  /**
   * Utilidad para localizar filas sólidas usando best practices (`has: cell`)
   */
  obtenerFilaPorNombre(username: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(username, { exact: true }).or(this.page.getByTitle(username, { exact: true })),
    });
  }
}
