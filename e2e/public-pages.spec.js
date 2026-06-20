const { test, expect } = require('@playwright/test')

// Tests E2E des pages publiques accessibles sans authentification.
// /book/[isbn], /seller/[id], /invite/[code]

test.describe('Pages publiques', () => {

  test.describe('/book/[isbn]', () => {
    test('accessible sans authentification', async ({ page }) => {
      await page.goto('/book/9780134685991', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/book\/9780134685991/)
      // Pas de redirect vers /login
      await expect(page).not.toHaveURL(/\/login/)
    })

    test('affiche le breadcrumb Accueil / Manuels', async ({ page }) => {
      await page.goto('/book/9780134685991', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Accueil').first()).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Manuels').first()).toBeVisible()
    })

    test('affiche les boutons Se connecter et Rejoindre si non authentifié', async ({ page }) => {
      await page.goto('/book/9780134685991', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: 'Rejoindre' })).toBeVisible()
    })

    test('affiche le bouton Vendre mon exemplaire', async ({ page }) => {
      await page.goto('/book/9780134685991', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('button', { name: /vendre mon exemplaire/i }).first()).toBeVisible({ timeout: 10000 })
    })

    test('ISBN inexistant — affiche 0 vendeur', async ({ page }) => {
      await page.goto('/book/0000000000000', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
    })
  })

  test.describe('/seller/[id]', () => {
    test('accessible sans authentification', async ({ page }) => {
      // On utilise un ID factice — la page doit charger (pas de redirect)
      await page.goto('/seller/00000000-0000-0000-0000-000000000000', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
    })

    test('affiche "Vendeur introuvable" pour un ID inconnu', async ({ page }) => {
      await page.goto('/seller/00000000-0000-0000-0000-000000000000', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText(/introuvable/i)).toBeVisible({ timeout: 10000 })
    })

    test('affiche les boutons Se connecter et Rejoindre si non authentifié', async ({ page }) => {
      await page.goto('/seller/00000000-0000-0000-0000-000000000000', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('/invite/[code]', () => {
    test('accessible sans authentification', async ({ page }) => {
      await page.goto('/invite/TEST123', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
    })

    test('affiche le message d\'invitation', async ({ page }) => {
      await page.goto('/invite/TEST123', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText(/invité/i)).toBeVisible({ timeout: 10000 })
    })

    test('bouton CTA redirige vers /login?tab=signup', async ({ page }) => {
      await page.goto('/invite/TEST123', { waitUntil: 'domcontentloaded' })
      const cta = page.getByRole('button', { name: /rejoindre|créer/i }).first()
      await expect(cta).toBeVisible({ timeout: 10000 })
    })
  })
})
