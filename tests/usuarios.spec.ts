import { test, expect } from '@playwright/test';
import { UsuariosPage } from './pages/UsuariosPage';
import { MESSAGES } from '@/config/messages';

const CASOS_DE_VALIDACION = [
  {
    descripcion: 'Debería requerir usuario de mínimo 3 caracteres',
    username: 'ab',
    password: 'password123',
    erroresEsperados: ['El usuario debe tener al'],
  },
  {
    descripcion: 'Debería requerir contraseña de mínimo 6 caracteres',
    username: 'vendedor_valido',
    password: '123',
    erroresEsperados: ['La contraseña debe tener al menos 6 caracteres'],
  },
  {
    descripcion: 'Debería requerir contraseña',
    username: 'vendedor_valido',
    password: '',
    erroresEsperados: ['La contraseña debe tener al menos 6 caracteres'],
  },
  {
    descripcion: 'Debería respetar límites máximos de username',
    username: 'u'.repeat(51),
    password: 'password123',
    erroresEsperados: ['Usuario demasiado largo'],
  },
  {
    descripcion: 'Debería fallar por duplicado',
    username: 'admin',
    password: 'password123',
    erroresEsperados: [MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION],
  },
  {
    descripcion: 'Debería fallar por duplicado (case insensitive)',
    username: 'aDmIn',
    password: 'password123',
    erroresEsperados: [MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION],
  },
];

test.beforeEach(async ({ page }) => {
  const usuariosPage = new UsuariosPage(page);
  await usuariosPage.goto();
});

test.describe.parallel('Gestión de Usuarios:', () => {
  for (const caso of CASOS_DE_VALIDACION) {
    test(`Validación: ${caso.descripcion}`, async ({ page }) => {
      const usuariosPage = new UsuariosPage(page);
      await usuariosPage.crearUsuario(caso.username, caso.password, UsuariosPage.ROLES.ADMIN);

      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await expect(usuariosPage.btnRegistrar).toBeVisible();
    });
  }

  test('Debería vaciar el formulario al cancelar', async ({ page }) => {
    const usuariosPage = new UsuariosPage(page);

    await usuariosPage.btnAgregarNuevo.click();
    await usuariosPage.inputUsername.fill('test_wipe');
    await usuariosPage.inputPassword.fill('password123');

    await usuariosPage.btnCancelar.click();

    await usuariosPage.btnAgregarNuevo.click();
    await expect(usuariosPage.inputUsername).toHaveValue('');
    await expect(usuariosPage.inputPassword).toHaveValue('');
  });

  test('Debería transitar correctamente el ciclo de desactivación y reactivación', async ({ page }) => {
    const usuariosPage = new UsuariosPage(page);
    const username = await usuariosPage.inyectarUsuarioEfimero();

    await usuariosPage.buscarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeVisible();

    await usuariosPage.desactivarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeHidden();

    await usuariosPage.verInactivos();

    await usuariosPage.buscarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeVisible();

    await usuariosPage.activarUsuario(username);
    await usuariosPage.buscarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeVisible();
  });

  test('Debería impedir ediciones inválidas', async ({ page }) => {
    const usuariosPage = new UsuariosPage(page);
    const username = await usuariosPage.inyectarUsuarioEfimero();

    // Filtramos el caso de contraseña obligatoria, ya que en edición dejarla en blanco es válido (no la modifica)
    const CASOS_EDICION = CASOS_DE_VALIDACION.filter((caso) => caso.descripcion !== 'Debería requerir contraseña');

    for (const caso of CASOS_EDICION) {
      await usuariosPage.editarUsuario(username, caso.username, caso.password);
      for (const errorTexto of caso.erroresEsperados) {
        await expect(page.getByText(errorTexto)).toBeVisible();
      }

      await usuariosPage.btnCancelar.click();
    }
  });

  test('Debería crear un nuevo usuario', async ({ page }) => {
    const testEntity = {
      usernameOriginal: 'crudUserTest',
      passwordOriginal: '123456',
    };
    const usuariosPage = new UsuariosPage(page);
    await usuariosPage.crearUsuario(testEntity.usernameOriginal, testEntity.passwordOriginal, UsuariosPage.ROLES.VENDEDOR);
    await usuariosPage.buscarUsuario(testEntity.usernameOriginal);
    const filaCreado = usuariosPage.obtenerFilaPorNombre(testEntity.usernameOriginal);
    await expect(filaCreado).toContainText(/Vendedor/i);
    await expect(page.getByText(testEntity.usernameOriginal, { exact: true })).toBeVisible();
  });

  test('Debería editar exitosamente', async ({ page }) => {
    const usuariosPage = new UsuariosPage(page);
    const username = await usuariosPage.inyectarUsuarioEfimero();

    const testEntity = {
      passwordOriginal: '123456',
      usernameEditado: username + username,
    };

    await usuariosPage.editarUsuario(username, testEntity.usernameEditado, testEntity.passwordOriginal, UsuariosPage.ROLES.VENDEDOR);
    await usuariosPage.buscarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeHidden();
    await usuariosPage.buscarUsuario(testEntity.usernameEditado);
    const filaEditado = usuariosPage.obtenerFilaPorNombre(testEntity.usernameEditado);
    await expect(filaEditado).toContainText(/Vendedor/i);
    await expect(page.getByText(testEntity.usernameEditado, { exact: true })).toBeVisible();
  });

  test('Debería desactivar y eliminar al usuario', async ({ page }) => {
    const usuariosPage = new UsuariosPage(page);
    const username = await usuariosPage.inyectarUsuarioEfimero();

    await usuariosPage.desactivarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeHidden();

    await usuariosPage.verInactivos();
    await usuariosPage.eliminarUsuario(username);
    await expect(page.getByText(username, { exact: true })).toBeHidden();
  });
});
