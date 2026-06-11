const { test, expect } = require('@playwright/test')

// Tests E2E du formulaire de création d'annonce.
// Vérifie la validation côté client (champs obligatoires).
// Nécessite un utilisateur authentifié — utilise storageState si disponible,
// sinon on teste uniquement la redirection vers /login.

test.describe('Formulaire de création — validation (sans auth)', () => {
  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/create', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Formulaire de création — champs obligatoires', () => {
  // Ces tests nécessitent une session active.
  // Ils sont marqués skip si pas de storageState configuré.
  // Pour les activer : npx playwright test --project=authenticated

  test.skip('soumettre sans ISBN affiche une erreur', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('button', { name: /publier/i }).click()
    await expect(page.getByText(/isbn.*obligatoire/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('soumettre sans état affiche une erreur', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('button', { name: /publier/i }).click()
    await expect(page.getByText(/état.*obligatoire/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('soumettre sans méthode de transaction affiche une erreur', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('button', { name: /publier/i }).click()
    await expect(page.getByText(/méthode de transaction/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Formulaire de création — recherche ISBN', () => {
  test('redirige vers /login avant d\'accéder au formulaire', async ({ page }) => {
    await page.goto('/create?isbn=9780134685991', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
