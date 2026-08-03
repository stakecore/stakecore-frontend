import { test, expect } from '@playwright/test'

test('/ renders', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()
})
