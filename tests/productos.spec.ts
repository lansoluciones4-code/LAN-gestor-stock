/* eslint-disable space-before-function-paren */
import { test, expect } from '@playwright/test';

// =========================================================================
// VARIABLES CONFIGURABLES
// =========================================================================
const TEST_DATA = {
  EQUIPO: 'iPhone 14',
  PROVEEDOR: 'TechWorld Distribuidora',
  DESC_NUEVA: 'Negro, 256GB - Kit Funda TEST',
  DESC_EDITADA: 'Negro, 256GB - Sin cargador EDITADO',
  PRECIO_COMPRA: '1000',
  PRECIO_VENTA: '1500',
  UNIDADES: '5',
  UNIDADES_EDITADAS: '10'
};

const UI = {
  // Botones Modales
  BTN_INGRESAR_STOCK: 'Ingresar Stock',
  BTN_SELECCIONAR_EQUIPO: 'Seleccionar Equipo',
  BTN_SELECCIONAR_PROVEEDOR: 'Seleccionar Proveedor',
  BTN_CONFIRMAR_INVENTARIO: 'Confirmar Inventario',
  BTN_CANCELAR: 'Cancelar',
  BTN_EDITAR: 'Editar',
  BTN_ELIMINAR: 'Eliminar',
  BTN_PURGAR: 'Purgar Stock',
  BTN_REGISTRAR_PERDIDA: 'Registrar Pérdida',
  BTN_CONFIRMAR_PERDIDA: 'Confirmar Pérdida',

  // Inputs/Placeholders
  INPUT_DESC: 'Ej: Negro, 256GB - Kit Funda',
  INPUT_PRECIO_COMPRA: 'input[name="purchasePrice"]',
  INPUT_PRECIO_VENTA: 'input[name="salePrice"]',
  INPUT_UNIDADES: '1', // placeholder temporal grabado
  INPUT_PERDIDA_CANTIDAD: 'Ej: 1', // placeholder
  INPUT_PERDIDA_MOTIVO: 'Ej: Pantalla rota al', // textbox name

  // Textos y Filtros
  FILTRO_VER_SIN_STOCK: 'Ver sin stock',
  DEFAULT_UNITS_VALUE: '1' //No es un placeholder, unidades siempre dice 1 por default
};

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  // URL de Productos
  await page.goto('http://localhost:3000/productos');
});

test.describe.parallel('Gestión de Productos: Validaciones y Lógica', () => {

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    // Abrir modal
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();

    // Llenar campos
    await page.getByRole('button', { name: UI.BTN_SELECCIONAR_EQUIPO }).click();
    await page.getByRole('button', { name: TEST_DATA.EQUIPO, exact: true }).click();
    await page.getByRole('textbox', { name: UI.INPUT_DESC }).fill('Test Wiping');

    // Llenar con force true si a veces auto-selecciona al hacer click
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill('5');
    await page.locator(UI.INPUT_PRECIO_COMPRA).fill('100');

    // Cancelar
    await page.getByRole('button', { name: UI.BTN_CANCELAR }).click();

    // Volver a abrir
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();

    // Validar vacío
    await expect(page.getByRole('textbox', { name: UI.INPUT_DESC })).toHaveValue('');
    await expect(page.getByPlaceholder(UI.INPUT_UNIDADES)).toHaveValue(UI.DEFAULT_UNITS_VALUE);
    await expect(page.locator(UI.INPUT_PRECIO_COMPRA)).toHaveValue('0');
    await expect(page.locator(UI.INPUT_PRECIO_VENTA)).toHaveValue('0');

    // Validar que el equipo haya vuelto al selector por defecto
    await expect(page.getByRole('button', { name: UI.BTN_SELECCIONAR_EQUIPO })).toBeVisible();
  });

  test('Validar no permitir cantidades ni precios negativos', async ({ page }) => {
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();

    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill('-1');
    await page.locator(UI.INPUT_PRECIO_COMPRA).fill('-100');
    await page.locator(UI.INPUT_PRECIO_VENTA).fill('-200');

    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_INVENTARIO }).click();

    await expect(page.getByText('El stock no puede ser negativo')).toBeVisible();
    await expect(page.getByText('El precio de compra no puede')).toBeVisible();
    await expect(page.getByText('El precio de venta no puede')).toBeVisible();
  });

  test('Validar borrado manual de campos numéricos', async ({ page }) => {
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();

    // Simulamos escribir y borrar para disparar validación de campo requerido / "debe ser número"
    // Las acciones de Playwright de borrar con fill('') deben bastar según product_actions.txt
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill('1');
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill('');

    await page.locator(UI.INPUT_PRECIO_COMPRA).fill('100');
    await page.locator(UI.INPUT_PRECIO_COMPRA).fill('');

    await page.locator(UI.INPUT_PRECIO_VENTA).fill('200');
    await page.locator(UI.INPUT_PRECIO_VENTA).fill('');

    await expect(page.getByText('El stock debe ser un número')).toBeVisible();
    await expect(page.getByText('El precio de compra debe ser un número')).toBeVisible();
    await expect(page.getByText('El precio de venta debe ser un número')).toBeVisible();
  });
});

test.describe.serial('Gestión de Productos: Ciclo de Vida CRUD y Mermas', () => {

  test('Debería crear un nuevo producto (Ingresar Stock)', async ({ page }) => {
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();

    // Equipo y Proveedor
    await page.getByRole('button', { name: UI.BTN_SELECCIONAR_EQUIPO }).click();
    await page.getByRole('button', { name: TEST_DATA.EQUIPO, exact: true }).click();

    await page.getByRole('button', { name: UI.BTN_SELECCIONAR_PROVEEDOR }).click();
    await page.getByRole('button', { name: TEST_DATA.PROVEEDOR }).first().click();

    // Textos Numéricos y Descripción
    await page.getByRole('textbox', { name: UI.INPUT_DESC }).fill(TEST_DATA.DESC_NUEVA);
    await page.locator(UI.INPUT_PRECIO_COMPRA).fill(TEST_DATA.PRECIO_COMPRA);
    await page.locator(UI.INPUT_PRECIO_VENTA).fill(TEST_DATA.PRECIO_VENTA);
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill(TEST_DATA.UNIDADES);

    // Confirmar
    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_INVENTARIO }).click();

    // Validar creación filtrando por nombre de descripción y equipo
    const filaCreado = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_NUEVA });
    await expect(filaCreado).toBeVisible();
    await expect(filaCreado).toContainText(TEST_DATA.EQUIPO);
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const filaOriginal = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_NUEVA });
    await filaOriginal.getByRole('button', { name: UI.BTN_EDITAR }).click();

    // Modificar valores
    await page.getByRole('textbox', { name: UI.INPUT_DESC }).fill(TEST_DATA.DESC_EDITADA);
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill(TEST_DATA.UNIDADES_EDITADAS);

    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_INVENTARIO }).click();

    // Verificar invisibilidad del anterior y presencia del nuevo
    await expect(page.getByRole('row').filter({ hasText: TEST_DATA.DESC_NUEVA })).toBeHidden();
    const filaEditada = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_EDITADA });
    await expect(filaEditada).toBeVisible();
    await expect(filaEditada).toContainText(TEST_DATA.UNIDADES_EDITADAS);
  });

  test('Debería fallar al registrar pérdida sin motivo', async ({ page }) => {
    const fila = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_EDITADA });
    await fila.getByRole('button', { name: UI.BTN_REGISTRAR_PERDIDA }).click();

    await page.getByPlaceholder(UI.INPUT_PERDIDA_CANTIDAD).fill('1');
    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_PERDIDA }).click();

    await expect(page.getByText('Debe especificar un motivo')).toBeVisible();
    await page.getByRole('button', { name: UI.BTN_CANCELAR }).click();
  });

  test('Debería registrar pérdida exitosamente', async ({ page }) => {
    const fila = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_EDITADA });
    await fila.getByRole('button', { name: UI.BTN_REGISTRAR_PERDIDA }).click();

    const qtyPerdida = '2';
    await page.getByPlaceholder(UI.INPUT_PERDIDA_CANTIDAD).fill(qtyPerdida);
    await page.getByRole('textbox', { name: UI.INPUT_PERDIDA_MOTIVO }).fill('Prueba perdida E2E');
    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_PERDIDA }).click();

    // Verificamos que contenga la actualización: 10 - 2 = 8
    const expectedQty = parseInt(TEST_DATA.UNIDADES_EDITADAS) - parseInt(qtyPerdida);
    await expect(fila).toContainText(expectedQty.toString());
  });

  test('Debería fallar al intentar eliminar un producto con historial de pérdidas', async ({ page }) => {
    const fila = page.getByRole('row').filter({ hasText: TEST_DATA.DESC_EDITADA });
    await fila.getByRole('button', { name: UI.BTN_ELIMINAR }).click();

    // Modal confirmación
    await page.getByRole('button', { name: UI.BTN_PURGAR }).click();

    // Validar mensaje de error de que no se puede eliminar por tener historial
    await expect(page.getByText('No se puede eliminar: este')).toBeVisible();
  });

  test('Debería crear y purgar exitosamente un producto sin historial', async ({ page }) => {
    // 1. Crear producto temporal sin pérdidas
    await page.getByRole('button', { name: UI.BTN_INGRESAR_STOCK }).click();
    await page.getByRole('button', { name: UI.BTN_SELECCIONAR_EQUIPO }).click();
    await page.getByRole('button', { name: TEST_DATA.EQUIPO, exact: true }).click();
    await page.getByRole('button', { name: UI.BTN_SELECCIONAR_PROVEEDOR }).click();
    await page.getByRole('button', { name: TEST_DATA.PROVEEDOR }).first().click();

    const descEliminar = 'Test para purgado final';
    await page.getByRole('textbox', { name: UI.INPUT_DESC }).fill(descEliminar);
    await page.locator(UI.INPUT_PRECIO_COMPRA).fill('100');
    await page.locator(UI.INPUT_PRECIO_VENTA).fill('200');
    await page.getByPlaceholder(UI.INPUT_UNIDADES).fill('5');
    await page.getByRole('button', { name: UI.BTN_CONFIRMAR_INVENTARIO }).click();

    const filaNueva = page.getByRole('row').filter({ hasText: descEliminar });
    await expect(filaNueva).toBeVisible();

    // 2. Proceder a purgarlo físicamente
    await filaNueva.getByRole('button', { name: UI.BTN_ELIMINAR }).click();
    await page.getByRole('button', { name: UI.BTN_PURGAR }).click();

    // Validar que desaparece del DOM y no hay error
    await expect(filaNueva).toBeHidden({ timeout: 15000 });
  });

});
