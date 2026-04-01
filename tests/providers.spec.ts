import { test, expect } from '@playwright/test';

/**
 * Este archivo de pruebas dejará la base de datos tal cual está al terminar.
 * Pruebas a realizar:
 * - Login admin y posterior navegacion a /proveedores
 * 
 * - Creacion de proveedor (esperan falla):
 *        - Todos los campos vacíos
 *        - Falta solo el nombre
 *        - Falta solo el teléfono
 *        - Falta solo el correo
 *        - Faltan nombre y teléfono
 *        - Faltan nombre y correo
 *        - Faltan teléfono y correo
 *        - Nombre, telefono y correo demasiado largos
 * 
 * - Prueba de desactivacion, reactivacion y eliminacion de proveedor:
 *      En esta prueba, se crea, desactiva, verifica desactivacion, se muestran desactivados,
 *      se verifica que esté listado, se reactiva, se verifica que esté listado,
 *      se ocultan desactivados, se verifica que esté listado, se elimina, se verifica eliminación.
 * - Creacion basica
 * - Busqueda del recien creado y que solo figure ese
 * - Edicion de todos los campos
 * - Eliminación
 */

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // Llenamos credenciales
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // Verificamos que salimos de la página de login exitosamente
  await expect(page).not.toHaveURL(/login/);
  await page.goto('http://localhost:3000/proveedores');
});

test.describe.parallel('Gestión de Proveedores (UI) (PARALLEL)', () => {
  // =====================================================================
  // PRUEBAS DE CASOS BORDE: VALIDACIONES DE FORMULARIO
  // =====================================================================

  // 1. Definimos todas las combinaciones posibles en un array
  const casosDeValidacion = [
    {
      descripcion: 'Todos los campos vacíos',
      nombre: '', telefono: '', correo: '',
      erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio', 'El correo es obligatorio']
    },
    {
      descripcion: 'Falta solo el nombre',
      nombre: '', telefono: '291 718-1273', correo: 'correo@ejemplo.com',
      erroresEsperados: ['El nombre debe tener al menos']
    },
    {
      descripcion: 'Falta solo el teléfono',
      nombre: 'Proveedor de Prueba', telefono: '', correo: 'correo@ejemplo.com',
      erroresEsperados: ['El teléfono es obligatorio']
    },
    {
      descripcion: 'Falta solo el correo',
      nombre: 'Proveedor de Prueba', telefono: '291 718-1273', correo: '',
      erroresEsperados: ['El correo es obligatorio']
    },
    {
      descripcion: 'Faltan nombre y teléfono',
      nombre: '', telefono: '', correo: 'correo@ejemplo.com',
      erroresEsperados: ['El nombre debe tener al menos', 'El teléfono es obligatorio']
    },
    {
      descripcion: 'Faltan nombre y correo',
      nombre: '', telefono: '291 718-1273', correo: '',
      erroresEsperados: ['El nombre debe tener al menos', 'El correo es obligatorio']
    },
    {
      descripcion: 'Faltan teléfono y correo',
      nombre: 'Proveedor de Prueba', telefono: '', correo: '',
      erroresEsperados: ['El teléfono es obligatorio', 'El correo es obligatorio']
    },
    {
      descripcion: 'Nombre, telefono y correo demasiado largos',
      nombre: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadosaaaaa', 
      telefono: '1234567891234567890012345678901', 
      correo: 'erroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsperadoserroresEsper@algo.com',
      erroresEsperados: ['Nombre demasiado largo', 'Número de teléfono demasiado', 'Too big: expected string to']
    }
  ];

  // 2. Playwright iterará sobre el array y creará un test por cada combinación
  for (const caso of casosDeValidacion) {
    
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      // Navegamos y abrimos el formulario
      await page.getByRole('link', { name: 'Proveedores' }).click();
      await page.getByRole('button', { name: 'Agregar Proveedor' }).click();

      // Llenamos los campos condicionalmente (solo si el string no está vacío)
      if (caso.nombre) {
        await page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' }).fill(caso.nombre);
      }
      if (caso.telefono) {
        await page.getByRole('textbox', { name: '+54 9 11 1234-' }).fill(caso.telefono);
      }
      if (caso.correo) {
        await page.getByRole('textbox', { name: 'ventas@distribuidora.com' }).fill(caso.correo);
      }

      // Intentamos registrar
      await page.getByRole('button', { name: 'Registrar Proveedor' }).click();

      // Verificamos que los mensajes de error ESPERADOS estén visibles
      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      // OPCIONAL Y RECOMENDADO: Verificar que la ventana NO se haya cerrado.
      // Si el botón de "Registrar Proveedor" sigue visible, significa que el sistema 
      // bloqueó correctamente el envío de datos a la base de datos.
      await expect(page.getByRole('button', { name: 'Registrar Proveedor' })).toBeVisible();
    });
    
  }

  // PRUEBA DE ELIMINACIÓN LÓGICA (DISABLE)
  test('Prueba de desactivacion, reactivacion y eliminacion de proveedor', async ({ page }) => {
    //Creo al proveedor
    const nombreProveedor = 'ProveedorDesactivable';
    const telefonoProveedor = '291 718-1273';
    const correoProveedor = 'correoEjemplo@correo.com';
    await page.getByRole('link', { name: 'Proveedores' }).click();
    await page.getByRole('button', { name: 'Agregar Proveedor' }).click();
    await page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' }).fill(nombreProveedor);
    await page.getByRole('textbox', { name: '+54 9 11 1234-' }).fill(telefonoProveedor);
    await page.getByRole('textbox', { name: 'ventas@distribuidora.com' }).fill(correoProveedor);
    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();
    //Oculto al proveedor
    const filaProveedor = page.getByRole('row').filter({ hasText: nombreProveedor });
    await filaProveedor.getByRole('button', { name: 'Desactivar' }).click();
    await expect(filaProveedor).toBeHidden({ timeout: 15000 });
    await page.getByText('Ver Inactivos').click();
    const filaProveedorDesactivado = page.getByRole('row').filter({ hasText: nombreProveedor });
    await expect(filaProveedorDesactivado).toBeVisible({ timeout: 15000 });
    await filaProveedorDesactivado.getByRole('button', { name: 'Activar' }).click();
    await expect(filaProveedorDesactivado).toBeVisible({ timeout: 15000 });
    await page.getByText('Ver Inactivos').click();
    const filaProveedorReactivado = page.getByRole('row').filter({ hasText: nombreProveedor });
    await expect(filaProveedorReactivado).toBeVisible({ timeout: 15000 });
    //Elimino al proveedor desde la pantalla de inactivos (estando este activado)
    await page.getByText('Ver Inactivos').click();
    await filaProveedorReactivado.getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('button', { name: 'Desvincular' }).click();
    await expect(filaProveedorReactivado).toBeHidden({ timeout: 15000 });
  });
});

test.describe.serial('Gestión de Proveedores (SERIAL) (UI)', () => {

  test('Debería crear un nuevo proveedor exitosamente', async ({ page }) => {
    const nombreProveedor = 'ProveedorCualquiera';
    const telefonoProveedor = '291 718-1273';
    const correoProveedor = 'correoEjemplo@correo.com';

    // Abrimos el formulario
    await page.getByRole('button', { name: 'Agregar Proveedor' }).click();

    // Llenamos los datos del nuevo proveedor
    await page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' }).fill(nombreProveedor);
    await page.getByRole('textbox', { name: '+54 9 11 1234-' }).fill(telefonoProveedor);
    await page.getByRole('textbox', { name: 'ventas@distribuidora.com' }).fill(correoProveedor);

    // Guardamos
    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();

    // 3. VERIFICACIÓN (Aserción)
    // Esperamos a que el formulario se cierre y el nuevo proveedor aparezca en la lista o tabla
    await expect(page.getByText(nombreProveedor)).toBeVisible();
  });

  test('Debería mostrar solo al nuevo proveedor', async ({ page }) => {
    const nombreProveedor = 'ProveedorCualquiera';
    await page.getByRole('textbox', { name: 'Buscar distribuidor por' }).fill(nombreProveedor);
    await expect(page.getByText(nombreProveedor)).toBeVisible();
    const filasTabla = page.getByRole('row');
    await expect(filasTabla).toHaveCount(2);
  });

  // 4. PRUEBA DE EDICIÓN (PUT visual)
  test('Debería editar los datos del proveedor creado exitosamente', async ({ page }) => {
    const nombreOriginal = 'ProveedorCualquiera';
    const telefonoOriginal = '291 718-1273';
    const correoOriginal = 'correoEjemplo@correo.com';
    const nuevoNombre = 'ProveedorEditadoNombre';
    const nuevoTelefono = '291 999-9999';
    const nuevoCorreo = 'editado@correo.com';

    // 1. LOCALIZAR LA FILA Y ABRIR EDICIÓN
    // En lugar de .first(), filtramos la fila que contiene el nombre original
    const fila = page.getByRole('row').filter({ hasText: nombreOriginal });
    await fila.getByRole('button', { name: 'Editar' }).click();

    // 2. ACTUALIZAR LOS CAMPOS
    // Playwright recomienda limpiar el campo antes de escribir si no se sobrescribe solo
    const campoNombre = page.getByRole('textbox', { name: 'Ej: Accesorios del Sur SRL' });
    await campoNombre.fill(nuevoNombre);

    const campoTelefono = page.getByRole('textbox', { name: '+54 9 11 1234-' });
    await campoTelefono.fill(nuevoTelefono);

    const campoCorreo = page.getByRole('textbox', { name: 'ventas@distribuidora.com' });
    await campoCorreo.fill(nuevoCorreo);

    // 3. GUARDAR CAMBIOS
    await page.getByRole('button', { name: 'Actualizar Firma' }).click();

    // 4. VERIFICACIÓN (Aserción)
    // Verificamos que el nombre viejo ya no esté y los nuevos datos sean visibles
    await expect(page.getByText(nombreOriginal)).toBeHidden();
    await expect(page.getByRole('cell', { name: telefonoOriginal })).toBeHidden();
    await expect(page.getByRole('cell', { name: correoOriginal })).toBeHidden();
    await expect(page.getByText(nuevoNombre)).toBeVisible();
    await expect(page.getByText(nuevoTelefono)).toBeVisible();
    await expect(page.getByText(nuevoCorreo)).toBeVisible();
  });

  // 5. PRUEBA DE ELIMINACIÓN (DELETE visual)
  test('Debería eliminar el proveedor creado/editado exitosamente', async ({ page }) => {
    const nombreProveedor = 'ProveedorEditadoNombre'; 
    // 1. ENCONTRAR LA FILA CORRECTA (Usando getByRole 'row')
    // Buscamos específicamente la fila de la tabla que contiene el nombre del proveedor
    const filaProveedor = page.getByRole('row').filter({ hasText: nombreProveedor });
    
    // 2. ELIMINAR
    // Hacemos clic en el botón "Eliminar" que vive estrictamente dentro de esa fila
    await filaProveedor.getByRole('button', { name: 'Eliminar' }).click();

    // 3. Confirmamos en la ventana emergente/modal
    await page.getByRole('button', { name: 'Desvincular' }).click();

    // 4. VERIFICACIÓN
    await expect(filaProveedor).toBeHidden({ timeout: 15000 });
  });
});
