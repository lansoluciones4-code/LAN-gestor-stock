/* eslint-disable space-before-function-paren */
import { test, expect } from '@playwright/test';


// =========================================================================
// VARIABLES PARA COMPLETAR POR EL USUARIO
// =========================================================================
const UI = {
  // Placeholders / Labels
  USERNAME: 'Ej: juan.perez', // Ej: 'Nombre de usuario'
  PASSWORD: 'Escribe una contraseña segura', // Ej: 'Contraseña'
  EDIT_PASSWORD: '******',
  OPCION_ROL_VENDEDOR: 'vendedor', // Value o texto visible de la opción Vendedor
  OPCION_ROL_ADMIN: 'admin', // Value o texto visible de la opción Admin

  // Botones y Búsqueda
  BTN_AGREGAR_NUEVO: 'Crear Credencial', // Ej: 'Agregar Usuario'
  BTN_REGISTRAR: 'Confirmar Credencial', // Ej: 'Guardar' / 'Registrar Usuario'
  BUSQUEDA: 'Buscar usuarios por nombre o', // Ej: 'Buscar por usuario'

  // Botones comunes
  BTN_EDITAR: 'Editar Seguridad',
  BTN_ACTUALIZAR: 'Confirmar Credencial',
  BTN_DESACTIVAR: 'Desactivar',
  BTN_VER_INACTIVOS: 'Ver Inactivos',
  BTN_ACTIVAR: 'Activar',
  BTN_ELIMINAR: 'Retirar Acceso',
  BTN_DESVINCULAR: 'Eliminar Acceso',
};

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir usuario de mínimo 3 caracteres',
    username: 'ab', password: 'password123',
    erroresEsperados: ['El usuario debe tener al']
  },
  {
    descripcion: 'Debería requerir contraseña de mínimo 6 caracteres',
    username: 'vendedor_valido', password: '123',
    erroresEsperados: ['La contraseña debe tener al']
  },
  {
    descripcion: 'Debería requerir contraseña',
    username: 'vendedor_valido', password: '',
    erroresEsperados: ['La contraseña es obligatoria']
  },
  {
    descripcion: 'Debería respetar límites máximos de username',
    username: 'u'.repeat(51), password: 'password123',
    erroresEsperados: ['Usuario demasiado largo']
  },
  {
    descripcion: 'Debería fallar por duplicado',
    username: 'admin', password: 'password123',
    erroresEsperados: ['El nombre de usuario ya está']
  },
  {
    descripcion: 'Debería fallar por duplicado (case insensitive)',
    username: 'aDmIn', password: 'password123',
    erroresEsperados: ['El nombre de usuario ya está']
  }
];

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  // URL de Usuarios
  await page.goto('http://localhost:3000/usuarios');
});

test.describe.parallel('Gestión de Usuarios: Validaciones y Lógica', () => {

  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const inputUsername = page.getByRole('textbox', { name: UI.USERNAME });
      // Asumimos que la contraseña la ocultas tras type="password", Playwright a veces requiere buscarla genéricamente si no hay un placeholder de accesibilidad, probamos con el label/placeholder primero
      const inputPassword = page.getByLabel(UI.PASSWORD).or(page.getByPlaceholder(UI.PASSWORD));

      const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
      const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

      await btnAgregar.click();

      if (caso.username) await inputUsername.fill(caso.username);
      if (caso.password) await inputPassword.fill(caso.password);

      await page.getByRole('combobox').selectOption('admin');

      await btnRegistrar.click();

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await expect(btnRegistrar).toBeVisible();
    });
  }

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const inputUsername = page.getByRole('textbox', { name: UI.USERNAME });
    const inputPassword = page.getByLabel(UI.PASSWORD).or(page.getByPlaceholder(UI.PASSWORD));

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });

    await btnAgregar.click();
    await inputUsername.fill('test_wipe');
    await inputPassword.fill('password123');

    await btnCancelar.click();

    await btnAgregar.click();
    await expect(inputUsername).toHaveValue('');
    await expect(inputPassword).toHaveValue('');
  });

  test('Debería transitar correctamente el ciclo de desactivación, reactivación y eliminación', async ({ page }) => {
    const username = 'testUser_logic';

    const inputUsername = page.getByRole('textbox', { name: UI.USERNAME });
    const inputPassword = page.getByLabel(UI.PASSWORD).or(page.getByPlaceholder(UI.PASSWORD));
    const editPassword = page.getByLabel(UI.EDIT_PASSWORD).or(page.getByPlaceholder(UI.EDIT_PASSWORD));

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });
    const btnVerInactivos = page.getByText(UI.BTN_VER_INACTIVOS);

    // Creación
    await btnAgregar.click();
    await inputUsername.fill(username);
    await inputPassword.fill('password_valido');
    await page.getByRole('combobox').selectOption('admin');
    await btnRegistrar.click();

    // Desactivación
    const filaActiva = page.getByRole('row').filter({ hasText: username });
    await expect(filaActiva).toBeVisible();
    await filaActiva.getByRole('button', { name: UI.BTN_DESACTIVAR }).click();
    await expect(filaActiva).toBeHidden({ timeout: 15000 });

    // Reactivación
    await btnVerInactivos.click();
    const filaInactiva = page.getByRole('row').filter({ hasText: username });
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });

    await filaInactiva.getByRole('button', { name: UI.BTN_ACTIVAR }).click();
    await expect(filaInactiva).toBeVisible({ timeout: 15000 });

    // Aprovechamos testUser_logic para probar validaciones en modo Edición
    const btnEditar = filaInactiva.getByRole('button', { name: UI.BTN_EDITAR });
    const btnActualizar = page.getByRole('button', { name: UI.BTN_ACTUALIZAR });
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });

    // Filtramos el caso de contraseña obligatoria, ya que en edición dejarla en blanco es válido (no la modifica)
    const CASOS_EDICION = CASOS_DE_VALIDACION.filter(caso => caso.descripcion !== 'Debería requerir contraseña');

    for (const caso of CASOS_EDICION) {
      await btnEditar.click();

      if (caso.username !== undefined) await inputUsername.fill(caso.username);
      if (caso.password !== undefined) await editPassword.fill(caso.password);
      else await editPassword.fill(''); // Borra la pass explícitamente si viene en blanco

      await btnActualizar.click();

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await btnCancelar.click();
    }
  });
});

test.describe.serial('Gestión de Usuarios: Ciclo de Vida CRUD', () => {

  const testEntity = {
    usernameOriginal: 'crudUserTest',
    passwordOriginal: '123456',
    usernameEditado: 'crudUserEdited',
  };

  test('Debería crear un nuevo usuario', async ({ page }) => {
    const inputUsername = page.getByRole('textbox', { name: UI.USERNAME });
    const inputPassword = page.getByLabel(UI.PASSWORD).or(page.getByPlaceholder(UI.PASSWORD));

    const btnAgregar = page.getByRole('button', { name: UI.BTN_AGREGAR_NUEVO });
    const btnRegistrar = page.getByRole('button', { name: UI.BTN_REGISTRAR });

    await btnAgregar.click();
    await inputUsername.fill(testEntity.usernameOriginal);
    await inputPassword.fill(testEntity.passwordOriginal);
    await page.getByRole('combobox').selectOption('vendedor');
    await btnRegistrar.click();

    const filaCreado = page.getByRole('row').filter({ hasText: testEntity.usernameOriginal });
    await expect(filaCreado).toContainText(/Vendedor/i);
    await expect(page.getByText(testEntity.usernameOriginal)).toBeVisible();
  });

  test('Debería buscar listar únicamente al usuario creado', async ({ page }) => {
    const inputBusqueda = page.getByRole('textbox', { name: UI.BUSQUEDA });

    await inputBusqueda.fill(testEntity.usernameOriginal);
    await expect(page.getByText(testEntity.usernameOriginal)).toBeVisible();

    const filasTabla = page.getByRole('row');
    await expect(filasTabla).toHaveCount(2);
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const filaOriginal = page.getByRole('row').filter({ hasText: testEntity.usernameOriginal });
    const btnEditar = filaOriginal.getByRole('button', { name: UI.BTN_EDITAR });

    const inputUsername = page.getByRole('textbox', { name: UI.USERNAME });
    const btnActualizar = page.getByRole('button', { name: UI.BTN_ACTUALIZAR });

    await btnEditar.click();
    await inputUsername.fill(testEntity.usernameEditado);

    // Cambiamos el rol a Admin para probar
    await page.getByRole('combobox').selectOption('admin');

    await btnActualizar.click();

    await expect(page.getByText(testEntity.usernameOriginal)).toBeHidden();
    const filaEditado = page.getByRole('row').filter({ hasText: testEntity.usernameEditado });
    await expect(filaEditado).toContainText(/admin/i);
    await expect(page.getByText(testEntity.usernameEditado)).toBeVisible();
  });

  test('Debería desactivar y eliminar al usuario', async ({ page }) => {
    const btnVerInactivos = page.getByText(UI.BTN_VER_INACTIVOS);
    const fila = page.getByRole('row').filter({ hasText: testEntity.usernameEditado });
    const btnEliminar = fila.getByRole('button', { name: UI.BTN_ELIMINAR });
    const btnConfirmar = page.getByRole('button', { name: UI.BTN_DESVINCULAR });

    await expect(fila).toBeVisible();
    await fila.getByRole('button', { name: UI.BTN_DESACTIVAR }).click();
    await expect(fila).toBeHidden();

    await btnVerInactivos.click();
    const filaInactiva = page.getByRole('row').filter({ hasText: testEntity.usernameEditado });
    await expect(filaInactiva).toBeVisible();

    await btnEliminar.click();
    await btnConfirmar.click();

    await expect(fila).toBeHidden();
  });
});
