/* eslint-disable space-before-function-paren */
import { test, expect } from '@playwright/test';

// =========================================================================
// VARIABLES PARA EL TEST
// =========================================================================
const NOMBRES = {
  PROVEEDOR: 'Proveedor Compuesto',
  EQUIPO: 'Equipo Compuesto',
  PRODUCTO_DESC: 'Producto Integrado Test'
};

test.beforeEach(async ({ page }) => {
  // Autenticación común para todas las vistas
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).not.toHaveURL(/login/);
});

test.describe.serial('Pruebas Compuestas: Restricciones de Eliminación', () => {

  test('Debería impedir eliminar un proveedor o equipo si están vinculados a un producto', async ({ page }) => {
    
    // ---------------------------------------------------------
    // 1. CREAR PROVEEDOR
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000/proveedores');
    await page.getByRole('button', { name: 'Agregar Proveedor' }).click();
    
    // Asumiendo los mismos placeholders que `proveedores.spec.ts`
    await page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' }).fill(NOMBRES.PROVEEDOR);
    await page.getByRole('textbox', { name: '+54 9 11 1234-' }).fill('291 919-9191');
    await page.getByRole('textbox', { name: 'ventas@distribuidora.com' }).fill('compuesto@test.com');
    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();
    
    // Validar creación (esperamos que salga en la lista)
    await expect(page.getByText(NOMBRES.PROVEEDOR)).toBeVisible();

    // ---------------------------------------------------------
    // 2. CREAR EQUIPO
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000/equipos');
    await page.getByRole('button', { name: 'Agregar Equipo' }).click();
    
    await page.getByRole('textbox', { name: 'Ej: iPhone 15 Pro Max' }).fill(NOMBRES.EQUIPO);
    await page.getByRole('button', { name: 'Fichar Equipo' }).click();
    
    await expect(page.getByText(NOMBRES.EQUIPO)).toBeVisible();

    // ---------------------------------------------------------
    // 3. CREAR PRODUCTO VINCULANDO EQUIPO Y PROVEEDOR
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000/productos');
    await page.getByRole('button', { name: 'Ingresar Stock' }).click();

    // Seleccionar Equipo Creado
    await page.getByRole('button', { name: 'Seleccionar Equipo' }).click();
    await page.getByRole('button', { name: NOMBRES.EQUIPO, exact: true }).click();

    // Seleccionar Proveedor Creado
    await page.getByRole('button', { name: 'Seleccionar Proveedor' }).click();
    await page.getByRole('button', { name: NOMBRES.PROVEEDOR }).first().click();

    // Llenar datos base de producto
    await page.getByRole('textbox', { name: 'Ej: Negro, 256GB - Kit Funda' }).fill(NOMBRES.PRODUCTO_DESC);
    await page.locator('input[name="purchasePrice"]').fill('100');
    await page.locator('input[name="salePrice"]').fill('200');
    await page.getByPlaceholder('1').fill('5'); // Unidades

    // Guardar Producto
    await page.getByRole('button', { name: 'Confirmar Inventario' }).click();

    // Validar creación de producto con esa descripción
    await expect(page.getByRole('row').filter({ hasText: NOMBRES.PRODUCTO_DESC })).toBeVisible();

    // ---------------------------------------------------------
    // 4. VALIDAR BORRADO DE PROVEEDOR (SE ESPERA ERROR)
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000/proveedores');
    const filaProveedor = page.getByRole('row').filter({ hasText: NOMBRES.PROVEEDOR });
    
    await filaProveedor.getByRole('button', { name: 'Eliminar' }).click();
    // Modal de confirmación de eliminación de proveedor
    await page.getByRole('button', { name: 'Desvincular' }).click();

    // Verificar notificación de error por protección referencial
    await expect(page.getByText('No se puede eliminar')).toBeVisible();

    // ---------------------------------------------------------
    // 5. VALIDAR BORRADO DE EQUIPO (SE ESPERA ERROR)
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000/equipos');
    const filaEquipo = page.getByRole('row').filter({ hasText: NOMBRES.EQUIPO });

    await filaEquipo.getByRole('button', { name: 'Eliminar' }).click();
    // Modal de confirmación (según `equipos.spec.ts`)
    await page.getByText('Eliminar', { exact: true }).click();

    // Verificar notificación de error por protección referencial
    await expect(page.getByText('No se puede eliminar')).toBeVisible();

  });
});
