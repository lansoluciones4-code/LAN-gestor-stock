/* eslint-disable space-before-function-paren */
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
    let esVisible = await landingPage.buscarProductoEnTodasLasPaginas(producto.descripcion);
    expect(esVisible).toBe(true);

    await productosPage.goto();
    await productosPage.alternarVisibilidadLanding(producto.equipo, producto.proveedor, producto.descripcion);

    await landingPage.goto();
    esVisible = await landingPage.buscarProductoEnTodasLasPaginas(producto.descripcion);
    expect(esVisible).toBe(false);
  });

});
