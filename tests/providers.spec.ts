import { test, expect } from '@playwright/test';

test.describe('Gestión de Proveedores (UI)', () => {
  // 1. PREPARACIÓN: Iniciamos sesión antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Llenamos credenciales
    await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Verificamos que salimos de la página de login exitosamente
    await expect(page).not.toHaveURL(/login/);
  });

  // 2. PRUEBA DE CREACIÓN (POST visual)
  test('Debería crear un nuevo proveedor exitosamente', async ({ page }) => {
    const nombreProveedor = 'ProveedorCualquiera';

    // Navegamos a la sección de Proveedores
    await page.getByRole('link', { name: 'Proveedores' }).click();

    // Abrimos el formulario
    await page.getByRole('button', { name: 'Agregar Proveedor' }).click();

    // Llenamos los datos del nuevo proveedor
    await page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' }).fill(nombreProveedor);
    await page.getByRole('textbox', { name: '+54 9 11 1234-' }).fill('291 718-1273');
    await page.getByRole('textbox', { name: 'ventas@distribuidora.com' }).fill('correoEjemplo@correo.com');

    // Guardamos
    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();

    // 3. VERIFICACIÓN (Aserción)
    // Esperamos a que el formulario se cierre y el nuevo proveedor aparezca en la lista o tabla
    await expect(page.getByText(nombreProveedor)).toBeVisible();
  });
});
