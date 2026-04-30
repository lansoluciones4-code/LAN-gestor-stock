import { test, expect } from '@playwright/test';
import { ProveedoresPage } from './pages/ProveedoresPage';
import { EquiposPage } from './pages/EquiposPage';
import { ProductosPage } from './pages/ProductosPage';
import { MESSAGES } from '@/config/messages';

test.describe.serial('Pruebas Compuestas: Restricciones de Eliminación', () => {
  test('Debería impedir eliminar un proveedor o equipo si están vinculados a un producto', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    const proveedoresPage = new ProveedoresPage(page);
    const equiposPage = new EquiposPage(page);

    await proveedoresPage.goto();
    await proveedoresPage.eliminarProveedor(producto.proveedor);

    await expect(page.getByText(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION)).toBeVisible();

    await equiposPage.goto();
    await equiposPage.eliminarEquipo(producto.equipo);

    await expect(page.getByText(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION)).toBeVisible();
  });
});
