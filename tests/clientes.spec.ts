import { test, expect } from '@playwright/test';


// =========================================================================
// VARIABLES PARA COMPLETAR POR EL USUARIO
// Reemplaza los siguientes strings con los textos exactos de tu UI
// =========================================================================
const UI = {
  // Placeholders / Labels de los campos del formulario
  NOMBRE: 'Ej: Carlos Pérez Martínez',
  TELEFONO: '+54 9 11 9876-',
  CORREO: 'cliente@correo.com',
  DNI: 'Ej: 35.123.456 o 20-35123456-',

  // Botones y Búsqueda
  BTN_AGREGAR_NUEVO: 'Registrar Cliente', // Ej: 'Agregar Cliente'
  BTN_REGISTRAR: 'Guardar Cliente', // Ej: 'Registrar Cliente' o 'Guardar'
  BUSQUEDA: 'Buscar clientes por nombre,', // Ej: 'Buscar cliente por'

  // Botones comunes (copiados de providers, ajustar si necesario)
  BTN_EDITAR: 'Editar Profile',
  BTN_ACTUALIZAR: 'Actualizar Ficha', // Ajustar al botón de guardar edición
  BTN_DESACTIVAR: 'Desactivar',
  BTN_VER_INACTIVOS: 'Ver Inactivos',
  BTN_ACTIVAR: 'Activar'
};

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir campos obligatorios',
    nombre: 'Cliente Valido', telefono: '', correo: '', dni: '',
    erroresEsperados: ['El teléfono es obligatorio', 'El correo electrónico es', 'El DNI es obligatorio']
  },
  {
    descripcion: 'Debería requerir un nombre de al menos 2 caracteres',
    nombre: 'a', telefono: '291 718-1273', correo: 'correo@ejemplo.com', dni: '12345678',
    erroresEsperados: ['El nombre debe tener al menos']
  },
  {
    descripcion: 'Debería requerir un teléfono valido',
    nombre: 'ab', telefono: 'abc', correo: 'correo@ejemplo.com', dni: '12345678',
    erroresEsperados: ['Formato de teléfono inválido']
  },
  {
    descripcion: 'Debería respetar límites máximos',
    // 101 caracteres -> falla nombre
    nombre: 'a'.repeat(101),
    // 31 caracteres -> falla teléfono
    telefono: '1234567890123456789012345678901',
    correo: 'largo'.repeat(21) + '@correo.com', // largo
    dni: '123456789012345678901', // 21 caracteres
    erroresEsperados: [
      'Nombre demasiado largo',
      'Número de teléfono demasiado',
      'Email demasiado largo', //TODO can change
      'Documento demasiado largo'
    ]
  }
];

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  // URL de la pestaña de Clientes
  await page.goto('http://localhost:3000/clientes');
});

test.describe.parallel('Gestión de Clientes: Validaciones y Lógica', () => {

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
      const inputTelefono = page.getByRole('textbox', { name: UI.TELEFONO });
      const inputCorreo = page.getByRole('textbox', { name: UI.CORREO });
      const inputDni = page.getByRole('textbox', { name: UI.DNI });

      const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
      const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

      await btnAgregar.click();

      if (caso.nombre) await inputNombre.fill(caso.nombre);
      if (caso.telefono) await inputTelefono.fill(caso.telefono);
      if (caso.correo) await inputCorreo.fill(caso.correo);
      if (caso.dni) await inputDni.fill(caso.dni);

      await btnRegistrar.click();

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await expect(btnRegistrar).toBeVisible();
    });
  }

  test('Debería transitar correctamente el ciclo de desactivación y reactivación', async ({ page }) => {
    const nombre = 'ClienteDesactivable';
    const telefono = '291 718-1273';
    const correo = 'correoEjemplo@correo.com';
    const dni = '12345678';

    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const inputTelefono = page.getByRole('textbox', { name: UI.TELEFONO });
    const inputCorreo = page.getByRole('textbox', { name: UI.CORREO });
    const inputDni = page.getByRole('textbox', { name: UI.DNI });

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });
    const btnVerInactivos = page.getByLabel(UI.BTN_VER_INACTIVOS);

    // Módulo de Creación
    await btnAgregar.click();
    await inputNombre.fill(nombre);
    await inputTelefono.fill(telefono);
    await inputCorreo.fill(correo);
    await inputDni.fill(dni);
    await btnRegistrar.click();

    // Desactivación Lógica
    const filaActiva = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaActiva).toBeVisible();
    await filaActiva.getByRole('button', { name: UI.BTN_DESACTIVAR }).click();
    await expect(filaActiva).toBeHidden({ timeout: 15000 });

    // Verificación en Inactivos y Reactivación
    await btnVerInactivos.click();
    const filaInactiva = page.getByRole('row').filter({ hasText: nombre });
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });

    await filaInactiva.getByRole('button', { name: UI.BTN_ACTIVAR }).click();
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });
  });
});

test.describe.serial('Gestión de Clientes: Ciclo de Vida CRUD', () => {

  const testEntity = {
    nombreOriginal: 'ClienteCualquiera',
    telefonoOriginal: '291 718-1273',
    correoOriginal: 'correoEjemplo@correo.com',
    dniOriginal: '11111111',
    nombreEditado: 'ClienteEditado',
    telefonoEditado: '291 999-9999',
    correoEditado: 'editado@correo.com',
    dniEditado: '99999999'
  };

  test('Debería crear un nuevo cliente exitosamente', async ({ page }) => {
    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const inputTelefono = page.getByRole('textbox', { name: UI.TELEFONO });
    const inputCorreo = page.getByRole('textbox', { name: UI.CORREO });
    const inputDni = page.getByRole('textbox', { name: UI.DNI });

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

    await btnAgregar.click();
    await inputNombre.fill(testEntity.nombreOriginal);
    await inputTelefono.fill(testEntity.telefonoOriginal);
    await inputCorreo.fill(testEntity.correoOriginal);
    await inputDni.fill(testEntity.dniOriginal);

    await btnRegistrar.click();

    await expect(page.getByText(testEntity.nombreOriginal)).toBeVisible();
  });

  test('Debería buscar listar únicamente al cliente creado', async ({ page }) => {
    const inputBusqueda = page.getByRole('textbox', { name: UI.BUSQUEDA });

    await inputBusqueda.fill(testEntity.nombreOriginal);
    await expect(page.getByText(testEntity.nombreOriginal)).toBeVisible();

    const filasTabla = page.getByRole('row');
    await expect(filasTabla).toHaveCount(2);
  });

  test('Debería editar exitosamente los datos', async ({ page }) => {
    const filaOriginal = page.getByRole('row').filter({ hasText: testEntity.nombreOriginal });
    const btnEditar = filaOriginal.getByRole('button', { name: UI.BTN_EDITAR });

    const inputNombre = page.getByRole('textbox', { name: UI.NOMBRE });
    const inputTelefono = page.getByRole('textbox', { name: UI.TELEFONO });
    const inputCorreo = page.getByRole('textbox', { name: UI.CORREO });
    const inputDni = page.getByRole('textbox', { name: UI.DNI });

    const btnActualizar = page.getByRole('button', { name: UI.BTN_ACTUALIZAR });

    await btnEditar.click();

    await inputNombre.fill(testEntity.nombreEditado);
    await inputTelefono.fill(testEntity.telefonoEditado);
    await inputCorreo.fill(testEntity.correoEditado);
    await inputDni.fill(testEntity.dniEditado);
    await btnActualizar.click();

    // Verificamos la desaparición (depende de los campos exactos q se muestren en la UI, usualmente Nombre o Correo y Tel)
    await expect(page.getByText(testEntity.nombreOriginal)).toBeHidden();

    await expect(page.getByText(testEntity.nombreEditado)).toBeVisible();
  });
});
