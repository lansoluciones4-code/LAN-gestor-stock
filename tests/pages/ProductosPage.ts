import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { products, devices, providers } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

export class ProductosPage {
  static readonly URL = '/productos';

  readonly page: Page;

  // =========================================================================
  // UI
  // =========================================================================
  static readonly UI = {
    BTN_SELECCIONAR_EQUIPO: 'Seleccionar Equipo',
    BTN_SELECCIONAR_PROVEEDOR: 'Seleccionar Proveedor',
    BTN_CONFIRMAR_INVENTARIO: 'Confirmar Inventario',
    BTN_CANCELAR: 'Cancelar',
    BTN_EDITAR: 'Editar',
    BTN_ELIMINAR: 'Eliminar',
    BTN_PURGAR: 'Purgar Stock',
    BTN_REGISTRAR_PERDIDA: 'Registrar Pérdida',
    BTN_CONFIRMAR_PERDIDA: 'Confirmar Pérdida',
    BTN_OCULTAR: 'Ocultar en Landing',
  } as const;

  // =========================================================================
  // Locators
  // =========================================================================
  readonly inputBusqueda: Locator;
  readonly inputMinPrecio: Locator;
  readonly inputMaxPrecio: Locator;

  readonly btnAgregarNuevo: Locator;
  readonly btnVerInactivos: Locator;
  readonly inputDescripcion: Locator;
  readonly inputPrecioCompra: Locator;
  readonly inputPrecioVenta: Locator;
  readonly inputUnidades: Locator;
  readonly btnConfirmarInventario: Locator;
  readonly btnCancelar: Locator;

  // Modales adicionales
  readonly inputPerdidaCantidad: Locator;
  readonly inputPerdidaMotivo: Locator;
  readonly btnConfirmarPerdida: Locator;
  readonly btnSincronizar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });
    this.inputMinPrecio = page.getByTestId(TEST_IDS.productos.inputBusquedaPrecioMin).filter({ visible: true });
    this.inputMaxPrecio = page.getByTestId(TEST_IDS.productos.inputBusquedaPrecioMax).filter({ visible: true });

    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar);
    this.btnVerInactivos = page.getByTestId(TEST_IDS.general.btnVerOcultos).filter({ visible: true });
    this.inputDescripcion = page.getByRole('textbox', { name: 'Ej: Negro, 256GB - Kit Funda' });
    this.inputPrecioCompra = page.locator('input[name="purchasePrice"]');
    this.inputPrecioVenta = page.locator('input[name="salePrice"]');
    this.inputUnidades = page.getByPlaceholder('1');
    this.btnConfirmarInventario = page.getByRole('button', { name: ProductosPage.UI.BTN_CONFIRMAR_INVENTARIO, exact: true });
    this.btnCancelar = page.getByRole('button', { name: ProductosPage.UI.BTN_CANCELAR, exact: true });

    this.inputPerdidaCantidad = page.getByPlaceholder('Ej: 1');
    this.inputPerdidaMotivo = page.getByRole('textbox', { name: 'Ej: Pantalla rota al' });
    this.btnConfirmarPerdida = page.getByRole('button', { name: ProductosPage.UI.BTN_CONFIRMAR_PERDIDA, exact: true });
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar);
  }

  // =========================================================================
  // Acciones
  // =========================================================================

  async goto() {
    await this.page.goto(ProductosPage.URL);
    await expect(this.page).toHaveURL(new RegExp(ProductosPage.URL));
  }

  async buscarProducto(termino: string) {
    await this.inputBusqueda.fill(termino);
    await this.hacerScrollHastaVisible(termino);
  }

  async hacerScrollHastaVisible(nombre: string) {
    const fila = this.page.getByRole('row').filter({
      has: this.page.getByText(nombre, { exact: true }).or(this.page.getByTitle(nombre, { exact: true })),
    });
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

  async filtrarPorPrecio(min?: string, max?: string) {
    await this.inputMinPrecio.fill('');
    await this.inputMaxPrecio.fill('');
    if (min !== undefined) {
      await this.inputMinPrecio.fill(min);
    }
    if (max !== undefined) {
      await this.inputMaxPrecio.fill(max);
    }
  }

  async abrirFormularioCreacion() {
    await this.btnAgregarNuevo.click();
  }

  async cancelarFormularioCreacion() {
    await this.btnCancelar.click();
  }

  async completarFormularioCreacion(equipo?: string, proveedor?: string, desc?: string, compra?: string, venta?: string, unidades?: string) {
    if (equipo !== undefined) {
      await this.page.getByRole('button', { name: ProductosPage.UI.BTN_SELECCIONAR_EQUIPO, exact: true }).click();
      await this.page.getByRole('button', { name: equipo, exact: true }).click();
    }

    if (proveedor !== undefined) {
      await this.page.getByRole('button', { name: ProductosPage.UI.BTN_SELECCIONAR_PROVEEDOR, exact: true }).click();
      await this.page.getByRole('button', { name: proveedor, exact: true }).first().click();
    }

    if (desc !== undefined) await this.inputDescripcion.fill(desc);
    if (compra !== undefined) {
      await this.inputPrecioCompra.fill('');
      await this.inputPrecioCompra.pressSequentially(compra);
    }
    if (venta !== undefined) {
      await this.inputPrecioVenta.fill('');
      await this.inputPrecioVenta.pressSequentially(venta);
    }
    if (unidades !== undefined) {
      await this.inputUnidades.fill('');
      await this.inputUnidades.pressSequentially(unidades);
    }
  }

  async confirmarFormularioCreacion() {
    await this.btnConfirmarInventario.click();
  }

  async abrirFormularioEdicion(equipo: string, proveedor: string, desc: string) {
    if (desc) await this.buscarProducto(desc);
    else if (equipo) await this.buscarProducto(equipo);

    const fila = this.obtenerFila(equipo, proveedor, desc);
    await fila.getByRole('button', { name: ProductosPage.UI.BTN_EDITAR, exact: true }).click();
  }

  async cancelarFormularioEdicion() {
    await this.btnCancelar.click();
  }

  async completarFormularioEdicion(
    equipoActual: string,
    proveedorActual: string,
    nuevoEquipo?: string,
    nuevoProveedor?: string,
    nuevaDesc?: string,
    nuevoCompra?: string,
    nuevoVenta?: string,
    nuevasUnidades?: string
  ) {
    if (nuevoEquipo !== undefined) {
      await this.page.getByRole('button', { name: equipoActual }).first().click();
      await this.page.getByRole('button', { name: nuevoEquipo, exact: true }).click();
    }

    if (nuevoProveedor !== undefined) {
      await this.page.getByRole('button', { name: proveedorActual }).first().click();
      await this.page.getByRole('button', { name: nuevoProveedor, exact: true }).click();
    }

    if (nuevaDesc !== undefined) await this.inputDescripcion.fill(nuevaDesc);
    
    if (nuevoCompra !== undefined) {
      await this.inputPrecioCompra.fill('');
      await this.inputPrecioCompra.pressSequentially(nuevoCompra);
    }
    
    if (nuevoVenta !== undefined) {
      await this.inputPrecioVenta.fill('');
      await this.inputPrecioVenta.pressSequentially(nuevoVenta);
    }
    
    if (nuevasUnidades !== undefined) {
      await this.inputUnidades.fill('');
      await this.inputUnidades.pressSequentially(nuevasUnidades);
    }
  }

  async confirmarFormularioEdicion() {
    await this.btnConfirmarInventario.click();
  }

  async verificarFormularioCreacionVacio() {
    await expect(this.inputDescripcion).toHaveValue('');
    await expect(this.inputUnidades).toHaveValue('1');
    await expect(this.inputPrecioCompra).toHaveValue('0,00');
    await expect(this.inputPrecioVenta).toHaveValue('0,00');
    await expect(this.page.getByRole('button', { name: ProductosPage.UI.BTN_SELECCIONAR_EQUIPO })).toBeVisible();
  }

  async crearProducto(equipo?: string, proveedor?: string, desc?: string, compra?: string, venta?: string, unidades?: string) {
    await this.abrirFormularioCreacion();
    await this.completarFormularioCreacion(equipo, proveedor, desc, compra, venta, unidades);
    await this.btnConfirmarInventario.click();
  }

  async editarProducto(equipo: string, proveedor: string, descActual: string, nuevoEquipo?: string, nuevoProveedor?: string, nuevaDesc?: string, nuevasUnidades?: string, nuevoPrecioC?: string, nuevoPrecioV?: string) {
    if (descActual) await this.buscarProducto(descActual);
    else if (equipo) await this.buscarProducto(equipo);

    const fila = this.obtenerFila(equipo, proveedor, descActual);
    await fila.getByRole('button', { name: ProductosPage.UI.BTN_EDITAR, exact: true }).click();

    if (nuevoEquipo !== undefined) {
      await this.page.getByRole('button', { name: equipo, exact: true }).click();
      await this.page.getByRole('button', { name: nuevoEquipo, exact: true }).click();
    }

    if (nuevoProveedor !== undefined) {
      await this.page.getByRole('button', { name: proveedor, exact: true }).first().click();
      await this.page.getByRole('button', { name: nuevoProveedor, exact: true }).first().click();
    }

    if (nuevaDesc !== undefined) await this.inputDescripcion.fill(nuevaDesc);
    if (nuevoPrecioC !== undefined) {
      await this.inputPrecioCompra.fill('');
      await this.inputPrecioCompra.pressSequentially(nuevoPrecioC);
    }
    if (nuevoPrecioV !== undefined) {
      await this.inputPrecioVenta.fill('');
      await this.inputPrecioVenta.pressSequentially(nuevoPrecioV);
    }
    if (nuevasUnidades !== undefined) {
      await this.inputUnidades.fill('');
      await this.inputUnidades.pressSequentially(nuevasUnidades);
    }

    await this.btnConfirmarInventario.click();
    await this.borrarBusqueda();
  }

  async registrarPerdida(equipo: string, proveedor: string, descActual: string, cantidad?: string, motivo?: string) {
    if (descActual) await this.buscarProducto(descActual);
    else if (equipo) await this.buscarProducto(equipo);

    const fila = this.obtenerFila(equipo, proveedor, descActual);
    await fila.getByRole('button', { name: ProductosPage.UI.BTN_REGISTRAR_PERDIDA, exact: true }).click();

    if (cantidad !== undefined) await this.inputPerdidaCantidad.fill(cantidad);
    if (motivo !== undefined) await this.inputPerdidaMotivo.fill(motivo);

    await this.btnConfirmarPerdida.click();
    await this.borrarBusqueda();
  }

  async alternarVisibilidadLanding(equipo: string, proveedor: string, descActual: string) {
    if (descActual) await this.buscarProducto(descActual);
    else if (equipo) await this.buscarProducto(equipo);

    const fila = this.obtenerFila(equipo, proveedor, descActual);
    // Asumimos que hay un switch o botón relacionado a la visibilidad en la landing
    await fila.getByRole('button', { name: ProductosPage.UI.BTN_OCULTAR, exact: true }).click();

    // Esperar un momento si hay una mutación optimista o un guardado automático
    await this.page.waitForTimeout(500);
    await this.borrarBusqueda();
  }

  async eliminarProducto(equipo: string, proveedor: string, descActual: string) {
    if (descActual) await this.buscarProducto(descActual);
    else if (equipo) await this.buscarProducto(equipo);

    const fila = this.obtenerFila(equipo, proveedor, descActual);
    await fila.getByRole('button', { name: ProductosPage.UI.BTN_ELIMINAR, exact: true }).click();
    await this.page.getByRole('button', { name: ProductosPage.UI.BTN_PURGAR, exact: true }).click();
    await this.borrarBusqueda();
  }

  async sincronizar() {
    await this.btnSincronizar.click();
  }

  async inyectarProductoEfimero(): Promise<{ descripcion: string; equipo: string; proveedor: string; stock: number; purchasePrice: string; salePrice: string }> {
    const hash = Math.random().toString(36).substring(2, 8);
    const equipo = `Eq Efim ${hash}`;
    const proveedor = {
      name: `Prov Efim ${hash}`,
      phone: `${hash}`,
      email: `proveedor${hash}@mail.com`,
    };
    const descripcion = `Prod Efim ${hash}`;
    const stock = 5;
    const priceBase = Math.floor(Math.random() * 900) + 100;
    const purchasePrice = priceBase.toString();
    const salePrice = (Number(priceBase) + 100).toString();

    const [device] = await db.insert(devices).values({ name: equipo }).returning({ id: devices.id });

    const [provider] = await db.insert(providers).values({ name: proveedor.name, phone: proveedor.phone, email: proveedor.email }).returning({ id: providers.id });

    await db.insert(products).values({
      deviceId: device.id,
      providerId: provider.id,
      description: descripcion,
      purchasePrice,
      salePrice,
      stock: stock,
    });

    await this.sincronizar();
    return {
      descripcion,
      equipo,
      proveedor: proveedor.name,
      stock,
      purchasePrice,
      salePrice,
    };
  }

  async verInactivos() {
    await this.btnVerInactivos.click();
  }

  // =========================================================================
  // Utilidades
  // =========================================================================

  obtenerFila(equipo: string, proveedor: string, desc: string): Locator {
    let fila = this.page.getByRole('row');

    if (equipo) {
      fila = fila.filter({
        has: this.page.getByText(equipo, { exact: true }).or(this.page.getByTitle(equipo, { exact: true })),
      });
    }

    if (proveedor) {
      fila = fila.filter({
        has: this.page.getByText(proveedor, { exact: true }).or(this.page.getByTitle(proveedor, { exact: true })),
      });
    }

    if (desc) {
      fila = fila.filter({
        has: this.page.getByText(desc, { exact: true }).or(this.page.getByTitle(desc, { exact: true })),
      });
    }

    return fila;
  }
}
