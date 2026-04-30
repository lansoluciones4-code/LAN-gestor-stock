import { test, expect } from '@playwright/test';
import { ProductosPage } from './pages/ProductosPage';
import { MESSAGES } from '@/config/messages';

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir equipo',
    equipo: undefined,
    proveedor: 'Proveedor 1',
    desc: '',
    compra: '1',
    venta: '100',
    unidades: '200',
    erroresEsperados: ['Debes seleccionar un equipo v'],
  },
  {
    descripcion: 'Debería requerir proveedor',
    equipo: 'Equipo 1',
    proveedor: undefined,
    desc: '',
    compra: '1',
    venta: '100',
    unidades: '200',
    erroresEsperados: ['Debes seleccionar un proveedor válido'],
  },
  {
    descripcion: 'Debería requerir equipo y proveedor',
    equipo: undefined,
    proveedor: undefined,
    desc: '',
    compra: '1',
    venta: '100',
    unidades: '200',
    erroresEsperados: ['Debes seleccionar un equipo v', 'Debes seleccionar un proveedor válido'],
  },
  {
    descripcion: 'Debería requerir venta, compra y unidades validas',
    equipo: 'Equipo 1',
    proveedor: 'Proveedor 1',
    desc: '',
    compra: '',
    venta: '',
    unidades: '',
    erroresEsperados: ['El precio de venta debe ser mayor a 0', 'El precio de compra debe ser mayor a 0', 'Debe ingresar una cantidad válida'],
  },
];

const CASOS_DE_EDICION = [
  {
    descripcion: 'Debería requerir venta, compra y unidades validas',
    equipo: 'Equipo 1',
    proveedor: 'Proveedor 1',
    desc: '',
    compra: '',
    venta: '',
    unidades: '',
    erroresEsperados: ['El precio de venta debe ser mayor a 0', 'El precio de compra debe ser mayor a 0', 'Debe ingresar una cantidad válida'],
  },
];

test.beforeEach(async ({ page }) => {
  const productosPage = new ProductosPage(page);
  await productosPage.goto();
});

test.describe.parallel('Gestión de Productos: Validaciones y Lógica', () => {
  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();

    await productosPage.abrirFormularioCreacion();
    await productosPage.completarFormularioCreacion(producto.equipo, undefined, 'Test Wiping', '100', undefined, '5');
    await productosPage.cancelarFormularioCreacion();

    await productosPage.abrirFormularioCreacion();
    await productosPage.verificarFormularioCreacionVacio();
  });

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const productosPage = new ProductosPage(page);
      const producto = await productosPage.inyectarProductoEfimero();
      const equipo = caso.equipo ? producto.equipo : undefined;
      const proveedor = caso.proveedor ? producto.proveedor : undefined;

      await productosPage.crearProducto(equipo, proveedor, caso.desc, caso.compra, caso.venta, caso.unidades);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  for (const caso of CASOS_DE_EDICION) {
    test(`Validación edición: ${caso.descripcion}`, async ({ page }) => {
      const productosPage = new ProductosPage(page);
      const producto = await productosPage.inyectarProductoEfimero();

      await productosPage.editarProducto(producto.equipo, producto.proveedor, caso.desc, undefined, undefined, undefined, caso.unidades, caso.compra, caso.venta);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }
    });
  }

  test('Debería crear un nuevo producto (Ingresar Stock)', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();

    const TEST_DATA = {
      EQUIPO: producto.equipo,
      PROVEEDOR: producto.proveedor,
      DESC: producto.equipo + producto.proveedor,
      PRECIO_COMPRA: '1000',
      PRECIO_VENTA: '1500',
      UNIDADES: '5',
      UNIDADES_EDITADAS: '10',
    };

    await productosPage.crearProducto(TEST_DATA.EQUIPO, TEST_DATA.PROVEEDOR, TEST_DATA.DESC, TEST_DATA.PRECIO_COMPRA, TEST_DATA.PRECIO_VENTA, TEST_DATA.UNIDADES);

    await productosPage.buscarProducto(TEST_DATA.DESC);
    const fila = productosPage.obtenerFila(TEST_DATA.EQUIPO, TEST_DATA.PROVEEDOR, TEST_DATA.DESC);
    await expect(fila).toBeVisible();
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();
    const TEST_DATA = {
      EQUIPO_VIEJO: producto.equipo,
      EQUIPO: undefined,
      PROVEEDOR_VIEJO: producto.proveedor,
      PROVEEDOR: producto.proveedor,
      DESC_VIEJA: producto.descripcion,
      DESC_EDITADA: producto.descripcion + producto.proveedor,
      PRECIO_COMPRA: '999',
      PRECIO_VENTA: '999',
      UNIDADES_EDITADAS: '10',
    };

    await productosPage.editarProducto(TEST_DATA.EQUIPO_VIEJO, TEST_DATA.PROVEEDOR_VIEJO, TEST_DATA.DESC_VIEJA, TEST_DATA.EQUIPO, TEST_DATA.PROVEEDOR, TEST_DATA.DESC_EDITADA, TEST_DATA.UNIDADES_EDITADAS, TEST_DATA.PRECIO_COMPRA, TEST_DATA.PRECIO_VENTA);

    await productosPage.buscarProducto(TEST_DATA.DESC_EDITADA);
    const filaEditada = productosPage.obtenerFila(TEST_DATA.EQUIPO_VIEJO, TEST_DATA.PROVEEDOR, TEST_DATA.DESC_EDITADA);
    await expect(filaEditada).toBeVisible();
    await expect(filaEditada).toContainText(TEST_DATA.UNIDADES_EDITADAS);
    await expect(filaEditada).toContainText(TEST_DATA.PRECIO_COMPRA);
    await expect(filaEditada).toContainText(TEST_DATA.PRECIO_VENTA);
  });

  test('Debería fallar al registrar pérdida sin motivo', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();
    const PRODUCTO = {
      EQUIPO: producto.equipo,
      PROVEEDOR: producto.proveedor,
      DESC: producto.descripcion,
      CANTIDAD: '1',
    };

    await productosPage.registrarPerdida(PRODUCTO.EQUIPO, PRODUCTO.PROVEEDOR, PRODUCTO.DESC, PRODUCTO.CANTIDAD, undefined);

    await expect(page.getByText('Debe especificar un motivo')).toBeVisible();
  });

  test('Debería registrar pérdida exitosamente, intentar eliminar el producto y fallar', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();

    const unidades = producto.stock;
    const unidadesAPerder = 1;
    const unidadesResultantes = unidades - unidadesAPerder;

    const PRODUCTO = {
      EQUIPO: producto.equipo,
      PROVEEDOR: producto.proveedor,
      DESC: producto.descripcion,
      MOTIVO: 'Algo',
      CANTIDAD_PERDIDA: unidadesAPerder.toString(),
      UNIDADES_NUEVO: unidadesResultantes.toString(),
    };

    await productosPage.registrarPerdida(PRODUCTO.EQUIPO, PRODUCTO.PROVEEDOR, PRODUCTO.DESC, PRODUCTO.CANTIDAD_PERDIDA, PRODUCTO.MOTIVO);

    await productosPage.buscarProducto(PRODUCTO.DESC);
    const fila = productosPage.obtenerFila(PRODUCTO.EQUIPO, PRODUCTO.PROVEEDOR, PRODUCTO.DESC);
    await expect(fila).toContainText(PRODUCTO.UNIDADES_NUEVO);

    await productosPage.eliminarProducto(PRODUCTO.EQUIPO, PRODUCTO.PROVEEDOR, PRODUCTO.DESC);

    await expect(page.getByText(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION)).toBeVisible();
  });

  test('Debería crear y purgar exitosamente un producto sin historial', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto = await productosPage.inyectarProductoEfimero();

    await productosPage.eliminarProducto(producto.equipo, producto.proveedor, producto.descripcion);

    await productosPage.buscarProducto(producto.descripcion);
    const fila = productosPage.obtenerFila(producto.equipo, producto.proveedor, producto.descripcion);
    await expect(fila).toBeHidden();
  });

  test('Debería filtrar por precio correctamente', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    const producto1 = await productosPage.inyectarProductoEfimero();
    const producto2 = await productosPage.inyectarProductoEfimero();

    await productosPage.filtrarPorPrecio(producto1.salePrice, undefined);

    await expect(page.getByRole('row').filter({ hasText: producto1.descripcion })).toBeVisible();

    await productosPage.filtrarPorPrecio(undefined, producto2.salePrice);
    await expect(page.getByRole('row').filter({ hasText: producto2.descripcion })).toBeVisible();
  });
});
