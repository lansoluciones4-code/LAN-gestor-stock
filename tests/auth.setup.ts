import { test as setup, expect } from '@playwright/test';
const authFile = 'playwright/.auth/user.json';
setup('Autenticarse', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  await expect(page).not.toHaveURL(/login/);
  await page.context().storageState({ path: authFile });
});
