const { test, expect } = require('@playwright/test')

// Tests E2E de navigation et de protection des routes (proxy.js).
// Ne nécessitent pas de session authentifiée.

test.describe('Navigation et pages publiques', () => {
  test('la page de connexion est accessible sans authentification', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('📚 BIBLIOCAMP')).toBeVisible()
  })

  test('les pages légales sont accessibles sans authentification', async ({ page }) => {
    await page.goto('/confidentialite', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /confidentialité/i })).toBeVisible({ timeout: 15000 })

    await page.goto('/cgu', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /conditions/i })).toBeVisible({ timeout: 15000 })
  })

  test.describe('protection des routes privées', () => {
    const protectedRoutes = ['/', '/create', '/inbox', '/profile', '/app']

    for (const route of protectedRoutes) {
      test(`${route} redirige vers /login si non authentifié`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForURL(/\/login/, { timeout: 20000 })
        await expect(page).toHaveURL(/\/login/)
      })
    }
  })

  test.describe('routes publiques accessibles sans auth', () => {
    const publicRoutes = [
      '/book/9780134685991',
      '/seller/00000000-0000-0000-0000-000000000000',
      '/invite/TEST123',
    ]

    for (const route of publicRoutes) {
      test(`${route} accessible sans authentification`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await expect(page).not.toHaveURL(/\/login/)
      })
    }
  })

  test('les headers de sécurité sont présents', async ({ page }) => {
    const response = await page.goto('/login')
    const headers = response.headers()
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['content-security-policy']).toBeTruthy()
  })
})
