import { test, expect } from '@playwright/test';
import { ProductosPage } from './pages/ProductosPage';
import { LandingPage } from './pages/LandingPage';

test.describe.serial('Pruebas de Landing Page', () => {
  test('Debería ocultar el producto de la landing cuando se desactiva su visibilidad', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.buscarProducto(producto.equipo);

    const tarjeta = landingPage.obtenerTarjetaProducto(producto.equipo);
    await tarjeta.scrollIntoViewIfNeeded();
    await expect(tarjeta).toBeVisible();

    await productosPage.goto();
    await productosPage.alternarVisibilidadLanding(producto.equipo, producto.proveedor, producto.descripcion);

    await landingPage.goto();
    await landingPage.buscarProducto(producto.equipo);
    await expect(tarjeta).toBeHidden();
  });
});
