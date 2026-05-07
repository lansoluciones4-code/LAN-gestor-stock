import { test, expect } from '@playwright/test';
import { VentasPage } from './pages/VentasPage';
import { ProductosPage } from './pages/ProductosPage';
import { ClientesPage } from './pages/ClientesPage';

test.describe('Pruebas E2E: Gestión de Ventas', () => {
  test('Debería realizar un flujo de venta normal completo con descuentos y pagos', async ({ page }) => {
    const ventasPage = new VentasPage(page);
    const productosPage = new ProductosPage(page);
    const clientesPage = new ClientesPage(page);

    await clientesPage.goto();
    const cliente = await clientesPage.inyectarClienteEfimero();

    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    await ventasPage.goto();
    await ventasPage.abrirModalVenta();
    await ventasPage.elegirCliente(cliente.nombre);
    await ventasPage.elegirProducto(producto.equipo, producto.descripcion);
    await ventasPage.confirmarCarrito();

    await ventasPage.aplicarDescuento('10', '50');
    await ventasPage.confirmarDescuento();

    await ventasPage.agregarMetodoEfectivo();

    await ventasPage.finalizarFactura();

    await expect(page.getByText('Venta realizada con éxito')).toBeVisible();

    await ventasPage.buscarVenta(cliente.nombre);
    const filaVenta = ventasPage.obtenerFilaPorNombre(cliente.nombre);
    await expect(filaVenta).toBeVisible();
  });
});
