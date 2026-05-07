import { Page, Locator, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
import { users, sales, saleItems, salePayments, products, devices, providers, customers } from '../../src/lib/db/schema';
import { TEST_IDS } from '@/constants/test-ids';

// Rutas y Constantes Globales expuestas
export class VentasPage {
  static readonly URL = '/ventas';

  readonly page: Page;

  // =========================================================================
  // Locators
  // =========================================================================

  // Page
  readonly inputBusqueda: Locator;
  readonly btnSincronizar: Locator;

  // Proceso de crear venta
  readonly btnAgregarNuevo: Locator;

  // Carrito
  readonly comboClienteVenta: Locator;
  readonly inputBusquedaCliente: Locator;
  readonly inputBusquedaProducto: Locator;
  readonly btnConfirmarCarrito: Locator;
  readonly btnCancelarCarrito: Locator;

  // Descuentos
  readonly inputDescuentoPorcentual: Locator;
  readonly inputDescuentoAbsoluto: Locator;
  readonly btnConfirmarDescuentos: Locator;
  readonly btnOmitirDescuentos: Locator;
  readonly btnQuitarDescuentos: Locator;

  // Metodos de pago
  readonly btnAgregarMetodoDePago: Locator;
  readonly btnFinalizarYFacturar: Locator;
  readonly btnVolverCarrito: Locator;
  readonly btnCancelarMetodoDePago: Locator;
  readonly btnAddAnotherMetodoDePago: Locator;
  readonly btnEfectivo: Locator;
  readonly btnTranserencia: Locator;
  readonly inputMontoPago: Locator;


  constructor(page: Page) {
    this.page = page;

    // Page
    this.inputBusqueda = page.getByTestId(TEST_IDS.general.inputBusquedaTabla).filter({ visible: true });
    this.btnSincronizar = page.getByTestId(TEST_IDS.general.btnSincronizar).filter({ visible: true });

    // Proceso de crear venta
    this.btnAgregarNuevo = page.getByTestId(TEST_IDS.general.btnAgregar).filter({ visible: true });

    // Carrito
    this.comboClienteVenta = page.getByTestId(TEST_IDS.ventas.pos.comboClienteVenta).filter({ visible: true });
    this.inputBusquedaCliente = page.getByTestId(TEST_IDS.ventas.pos.inputBusquedaCliente).filter({ visible: true });
    this.inputBusquedaProducto = page.getByTestId(TEST_IDS.ventas.pos.inputBusquedaProducto).filter({ visible: true });
    this.btnConfirmarCarrito = page.getByTestId(TEST_IDS.ventas.pos.btnConfirmarCarrito).filter({ visible: true });
    this.btnCancelarCarrito = page.getByTestId(TEST_IDS.ventas.pos.btnCancelarCarrito).filter({ visible: true });

    // Descuentos
    this.inputDescuentoPorcentual = page.getByTestId(TEST_IDS.ventas.discount.descuentoPorcentual).filter({ visible: true });
    this.inputDescuentoAbsoluto = page.getByTestId(TEST_IDS.ventas.discount.descuentoAbsoluto).filter({ visible: true });
    this.btnConfirmarDescuentos = page.getByTestId(TEST_IDS.ventas.discount.btnConfirmarDescuento).filter({ visible: true });
    this.btnOmitirDescuentos = page.getByTestId(TEST_IDS.ventas.discount.btnOmitirDescuento).filter({ visible: true });
    this.btnQuitarDescuentos = page.getByTestId(TEST_IDS.ventas.discount.btnQuitarDescuento).filter({ visible: true });

    // Metodos de pago
    this.btnAgregarMetodoDePago = page.getByTestId(TEST_IDS.ventas.payment.btnAddMetodoDePago).filter({ visible: true });
    this.btnFinalizarYFacturar = page.getByTestId(TEST_IDS.ventas.payment.btnFinalizarYFacturar).filter({ visible: true });
    this.btnVolverCarrito = page.getByTestId(TEST_IDS.ventas.payment.btnVolverCarrito).filter({ visible: true });
    this.btnCancelarMetodoDePago = page.getByTestId(TEST_IDS.ventas.payment.btnCancelarMetodoDePago).filter({ visible: true });
    this.btnAddAnotherMetodoDePago = page.getByTestId(TEST_IDS.ventas.payment.btnAddAnotherMetodoDePago).filter({ visible: true });
    this.btnEfectivo = page.getByTestId(TEST_IDS.ventas.payment.btnEfectivo).filter({ visible: true });
    this.btnTranserencia = page.getByTestId(TEST_IDS.ventas.payment.btnTranserencia).filter({ visible: true });
    this.inputMontoPago = page.getByTestId(TEST_IDS.ventas.payment.inputMonto).filter({ visible: true });
  }

  // =========================================================================
  // Acciones (Comportamientos abstractos)
  // =========================================================================

  /**
   * Navega directamente a la página de usuarios
   */
  async goto() {
    await this.page.goto(VentasPage.URL);
    await expect(this.page).toHaveURL(new RegExp(VentasPage.URL));
  }

  /**
   * Realiza una búsqueda mediante el textbox
   */
  async buscarVenta(nombre: string) {
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

    const scroller = this.page.getByTestId('virtuoso-scroller');
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

  async eliminarVenta(nombre: string) {
    await this.buscarVenta(nombre);
    const fila = this.obtenerFilaPorNombre(nombre);
    await fila.getByRole('button', { name: 'Anular Venta', exact: true }).click();
    await fila.getByRole('button', { name: 'Confirmar Anulación', exact: true }).click();
    await this.borrarBusqueda();
  }

  async sincronizar() {
    await this.btnSincronizar.click();
  }

  async abrirModalVenta() {
    await this.btnAgregarNuevo.click();
  }

  async elegirCliente(nombre: string) {
    await this.comboClienteVenta.click();
    await this.buscarCliente(nombre);
    await this.page.getByRole('button', { name: nombre, exact: true }).click();
  }

  async buscarCliente(nombre: string) {
    await this.inputBusquedaCliente.fill(nombre);
  }

  async elegirProducto(equipo: string, descripcion: string) {
    await this.buscarProducto(equipo, descripcion);
    await this.page.getByTestId(TEST_IDS.ventas.pos.btnAgregarProductoLista).first().click();
  }

  async buscarProducto(equipo: string, descripcion: string) {
    await this.inputBusquedaProducto.fill(equipo + ' ' + descripcion);
  }

  async confirmarCarrito() {
    await this.btnConfirmarCarrito.click();
  }

  async aplicarDescuento(porcentual?: string, absoluto?: string) {
    if (porcentual !== undefined) {
      await this.inputDescuentoPorcentual.fill(porcentual);
    }
    if (absoluto !== undefined) {
      await this.inputDescuentoAbsoluto.fill(absoluto);
    }
  }

  async confirmarDescuento() {
    await this.btnConfirmarDescuentos.click();
  }

  async omitirDescuento() {
    await this.btnOmitirDescuentos.click();
  }

  async quitarDescuento() {
    await this.btnQuitarDescuentos.click();
  }

  async agregarMetodoEfectivo(monto?: string) {
    await this.btnEfectivo.click();

    if (monto !== undefined) {
      await this.inputMontoPago.fill(monto);
    }

    await this.btnAgregarMetodoDePago.click();
  }

  async agregarMetodoTransferencia(monto?: string) {
    await this.btnTranserencia.click();

    if (monto !== undefined) {
      await this.inputMontoPago.fill(monto);
    }

    await this.btnAgregarMetodoDePago.click();
  }

  async finalizarFactura() {
    await this.btnFinalizarYFacturar.click();
  }


  async inyectarVentaEfimera(
    totalVenta: string = '1000.00'
  ): Promise<{
    saleId: string;
    vendorUsername: string;
    customerName: string;
    productDescription: string;
  }> {
    const hash = Math.random().toString(36).substring(2, 8);
    const vendorName = `vendor_${hash}`;
    const custName = `Cliente ${hash}`;
    const deviceName = `Eq ${hash}`;
    const providerName = `Prov ${hash}`;
    const prodDesc = `Prod ${hash}`;

    // --------- Vendedor ---------
    const [vendor] = await db.insert(users).values({
      username: vendorName,
      passwordHash: 'dummy_hash',
      role: 'vendedor',
      isActive: true,
    }).returning({ id: users.id });

    // --------- Cliente ---------
    const [customer] = await db.insert(customers).values({
      name: custName,
      phone: '123456789',
      email: `cliente${hash}@mail.com`,
      documentNumber: `DOC-${hash}`,
    }).returning({ id: customers.id });

    // --------- Producto ---------
    const [device] = await db.insert(devices).values({ name: deviceName }).returning({ id: devices.id });
    const [provider] = await db.insert(providers).values({ name: providerName, phone: '123', email: 'p@p.com' }).returning({ id: providers.id });
    const [product] = await db.insert(products).values({
      deviceId: device.id,
      providerId: provider.id,
      description: prodDesc,
      purchasePrice: '500',
      salePrice: totalVenta,
      stock: 10,
    }).returning({ id: products.id });

    // --------- Venta ---------
    const [sale] = await db.insert(sales).values({
      vendorId: vendor.id,
      customerId: customer.id,
      total: totalVenta,
      discountAmount: '0',
      discountPercentage: '0',
    }).returning({ id: sales.id });

    // --------- Item de Venta y Pago ---------
    await db.insert(saleItems).values({
      saleId: sale.id,
      productId: product.id,
      quantity: 1,
      unitPrice: totalVenta,
      subtotal: totalVenta,
    });

    await db.insert(salePayments).values({
      saleId: sale.id,
      type: 'efectivo',
      amount: totalVenta,
    });

    await this.sincronizar();
    return {
      saleId: sale.id,
      vendorUsername: vendorName,
      customerName: custName,
      productDescription: prodDesc,
    };
  }

  // =========================================================================
  // Utilidades de Locators dinámicos
  // =========================================================================

  obtenerFilaPorNombre(username: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(username, { exact: true }).or(this.page.getByTitle(username, { exact: true })),
    });
  }
}
