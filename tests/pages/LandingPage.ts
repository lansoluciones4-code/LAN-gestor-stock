import { TEST_IDS } from '@/constants/test-ids';
import { Page, Locator, expect } from '@playwright/test';

export class LandingPage {
  static readonly URL = '/home';

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // =========================================================================
  // Acciones
  // =========================================================================

  async goto() {
    await this.page.goto(LandingPage.URL);
    await expect(this.page).toHaveURL(new RegExp(LandingPage.URL));
  }

  obtenerTarjetaProducto(texto: string): Locator {
    return this.page.locator('div.group.relative.flex.flex-col').filter({
      hasText: new RegExp(texto, 'i')
    });
  }

  async productoEsVisible(nombre: string): Promise<boolean> {
    const tarjeta = this.obtenerTarjetaProducto(nombre);
    return await tarjeta.isVisible();
  }

  async clickSiguientePagina(): Promise<boolean> {
    const btn = this.page.getByTestId(TEST_IDS.landing.btnSiguientePag);
    if (await btn.isVisible()) {
      const className = await btn.getAttribute('class');
      const isDisabled = await btn.getAttribute('aria-disabled') === 'true' || className?.includes('pointer-events-none');

      if (!isDisabled) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click({ force: true });
        await this.page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  async buscarProductoEnTodasLasPaginas(nombre: string): Promise<boolean> {
    await this.page.waitForSelector('div.group.relative.flex.flex-col', { state: 'visible', timeout: 5000 }).catch(() => { });

    while (true) {
      if (await this.productoEsVisible(nombre)) {
        return true;
      }

      const hayMasPaginas = await this.clickSiguientePagina();
      if (!hayMasPaginas) {
        break;
      }
    }
    return false;
  }
}
