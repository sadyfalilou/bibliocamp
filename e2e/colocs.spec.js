const { test, expect } = require('@playwright/test')

// Tests E2E de la fonctionnalité Colocs (annonces de chambre/coloc).
// Les vues Colocs vivent dans /app (protégé) et /admin/roommate-reports
// (admin) — sans session active, on vérifie seulement les redirections.

test.describe('Colocs — accès sans authentification', () => {
  test('/app?view=colocs redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/app?view=colocs', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('/admin/roommate-reports redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/admin/roommate-reports', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Colocs — vues protégées (avec auth)', () => {
  // Ces tests nécessitent une session active.
  // Marqués skip si pas de storageState configuré.
  // Pour les activer : npx playwright test --project=authenticated

  test.skip('la page "Trouver un coloc" liste les annonces actives', async ({ page }) => {
    await page.goto('/app?view=colocs')
    await expect(page.getByRole('heading', { name: /trouver un coloc/i })).toBeVisible({ timeout: 10000 })
  })

  test.skip('publier une annonce sans titre affiche une erreur', async ({ page }) => {
    await page.goto('/app?view=publier-coloc')
    await page.getByRole('button', { name: /publier l'annonce/i }).click()
    await expect(page.getByText(/titre.*obligatoire/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('cliquer sur une annonce ouvre le panneau de détail', async ({ page }) => {
    await page.goto('/app?view=colocs')
    await page.getByText(/\$\/mois/).first().click()
    await expect(page.getByRole('button', { name: /contacter/i })).toBeVisible({ timeout: 5000 })
  })
})
