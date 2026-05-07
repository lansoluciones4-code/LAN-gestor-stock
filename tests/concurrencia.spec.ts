import { test, expect } from '@playwright/test';
import { ClientesPage } from './pages/ClientesPage';
import { ProductosPage } from './pages/ProductosPage';
import { ProveedoresPage } from './pages/ProveedoresPage';
import { VentasPage } from './pages/VentasPage';
import { EquiposPage } from './pages/EquiposPage';

test.describe.parallel('Pruebas de Concurrencia', () => {
  test('Escenario A: Edición Concurrente de Cliente (Lost Update)', async ({ browser }) => {
    const errorMessage = "Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente.";

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const clientesPage1 = new ClientesPage(page1);
    const clientesPage2 = new ClientesPage(page2);

    await clientesPage1.goto();
    const clienteEfimero = await clientesPage1.inyectarClienteEfimero();

    await clientesPage2.goto();

    await clientesPage1.buscarCliente(clienteEfimero.nombre);
    await clientesPage2.buscarCliente(clienteEfimero.nombre);

    const fila1 = clientesPage1.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila1.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    const fila2 = clientesPage2.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila2.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    await clientesPage1.inputTelefono.fill('1111111111');
    await clientesPage1.btnActualizar.click();

    await expect(clientesPage1.inputTelefono).toBeHidden();

    await clientesPage2.inputNombre.fill('Nombre Modificado');
    await clientesPage2.btnActualizar.click();

    await expect(page2.getByText(errorMessage)).toBeVisible();

    await clientesPage2.btnCancelar.click();
    await clientesPage2.sincronizar();
    await clientesPage2.buscarCliente(clienteEfimero.nombre);
    const fila2Sync = clientesPage2.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila2Sync.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    await expect(clientesPage2.inputTelefono).toHaveValue('1111111111');

    await context1.close();
    await context2.close();
  });

  test('Escenario B: Venta vs Edición de Producto', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const errorMessage = 'Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente.';

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const productosPage1 = new ProductosPage(page1);

    const clientesPage = new ClientesPage(page2);
    await clientesPage.goto();
    const cliente = await clientesPage.inyectarClienteEfimero();

    await productosPage1.goto();
    const producto = await productosPage1.inyectarProductoEfimero();

    // Usuario 2 Inicia venta
    const ventasPage2 = new VentasPage(page2);
    await ventasPage2.goto();
    await ventasPage2.abrirModalVenta();
    await ventasPage2.elegirCliente(cliente.nombre);
    await ventasPage2.elegirProducto(producto.equipo, producto.descripcion);

    // Usuario 1 Inicia edicion
    const nuevaDesc = producto.descripcion + 'a';
    await productosPage1.abrirFormularioEdicion(producto.equipo, producto.proveedor, producto.descripcion);
    await productosPage1.completarFormularioEdicion(producto.equipo, producto.proveedor, undefined, undefined, nuevaDesc);

    // Usuario 2 finaliza venta
    await ventasPage2.confirmarCarrito();
    await ventasPage2.omitirDescuento();
    await ventasPage2.agregarMetodoEfectivo();
    await ventasPage2.finalizarFactura();

    await expect(page2.getByText('Venta realizada con éxito')).toBeVisible();

    // Usuario 1 Finaliza edicion
    await productosPage1.confirmarFormularioEdicion();

    // Asserts
    await expect(page1.getByText(errorMessage)).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test('Escenario C: Eliminación de Entidad Relacionada', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const errorMessage = 'Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente.';

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const equiposPage = new EquiposPage(page1);
    await equiposPage.goto();
    const equipo = await equiposPage.inyectarEquipoEfimero();

    const productosPage1 = new ProductosPage(page1);
    const proveedoresPage2 = new ProveedoresPage(page2);

    await proveedoresPage2.goto();
    const proveedor = await proveedoresPage2.inyectarProveedorEfimero();

    // Usuario 1 Inicia creación de producto
    await productosPage1.goto();
    await productosPage1.abrirFormularioCreacion();
    await productosPage1.completarFormularioCreacion(equipo, proveedor, undefined, '1', '1', undefined);

    // Usuario 2 Elimina proveedor
    await proveedoresPage2.eliminarProveedor(proveedor);

    await expect(page2.getByText('Proveedor eliminado/a exitosamente')).toBeVisible();

    // Usuario 1 Finaliza creación de producto
    await productosPage1.confirmarFormularioCreacion();

    // Asserts
    await expect(page1.getByText(errorMessage)).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
