const { test, expect } = require('@playwright/test')

// Tests E2E du parcours d'authentification.
// Génère un email unique à chaque run pour éviter les collisions.
const uniqueEmail = () => `e2e-${Date.now()}@bibliocamp-test.ca`
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Authentification', () => {
  test('affiche le formulaire de connexion par défaut', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('ton@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('affiche une erreur sur identifiants invalides', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('ton@email.com').fill('inexistant@bibliocamp-test.ca')
    await page.getByPlaceholder('••••••••').fill('mauvaisMotDePasse123')

    // L'appli affiche les erreurs via window.alert()
    const dialogPromise = page.waitForEvent('dialog', { timeout: 20000 })
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    const dialog = await dialogPromise
    expect(dialog.message().length).toBeGreaterThan(0)
    await dialog.accept()
  })

  test('permet de créer un compte (signup)', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Créer un compte', exact: true }).first().click()

    await page.getByPlaceholder('ton@email.com').fill(uniqueEmail())
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click()

    // Confirmation visuelle attendue après inscription
    await expect(page.getByText(/compte créé/i)).toBeVisible({ timeout: 10000 })
  })
})
