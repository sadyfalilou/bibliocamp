const { test, expect } = require('@playwright/test')

// Tests E2E du parcours d'authentification.
// Génère un email unique à chaque run pour éviter les collisions.
const uniqueEmail = () => `e2e-${Date.now()}@bibliocamp-test.ca`
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Authentification', () => {
  test('affiche le formulaire de connexion par défaut', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('alexandre@uqam.ca')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••').first()).toBeVisible()
  })

  test('affiche une erreur sur identifiants invalides', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('alexandre@uqam.ca').fill('inexistant@bibliocamp-test.ca')
    await page.getByPlaceholder('••••••••').first().fill('mauvaisMotDePasse123')

    // L'appli affiche les erreurs inline (pas de window.alert())
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await expect(page.getByText('⚠️').locator('..')).toBeVisible({ timeout: 20000 })
  })

  test('permet de créer un compte (signup)', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Créer un compte', exact: true }).first().click()

    await page.getByPlaceholder('Alexandre', { exact: true }).fill('E2E')
    await page.getByPlaceholder('Tremblay', { exact: true }).fill('Test')
    await page.getByPlaceholder('alexandre@uqam.ca').fill(uniqueEmail())
    await page.getByPlaceholder('••••••••').nth(0).fill(TEST_PASSWORD)
    await page.getByPlaceholder('••••••••').nth(1).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click()

    // Le compte créé connecte automatiquement et redirige vers le dashboard
    await page.waitForURL(/\/app/, { timeout: 15000 })
  })
})
