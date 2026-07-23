import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('page-home')).toBeVisible();
});

test('navigates through params, nested outlet, and custom useLink', async ({
  page,
}) => {
  await page.getByTestId('project-router').click();
  await expect(page).toHaveURL(/\/projects\/router\/overview$/);
  await expect(page.getByTestId('project-overview')).toContainText('router');
  await expect(page.getByTestId('project-group-state')).toHaveText('active');

  await page.getByRole('link', { name: 'Tasks' }).click();
  await expect(page).toHaveURL(/\/projects\/router\/tasks\/integration-tests$/);
  await expect(page.getByTestId('project-task')).toContainText(
    'Integration tests',
  );
  await expect(page.getByTestId('custom-task-path')).toHaveText(
    '/projects/solid/tasks/integration-tests',
  );

  await page.getByTestId('custom-task-link').click();
  await expect(page).toHaveURL(/\/projects\/solid\/tasks\/integration-tests$/);
  await expect(page.getByTestId('project-task')).toBeVisible();
});

test('handles search query tracker and history controls', async ({ page }) => {
  await page.getByRole('link', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search\?q=solid$/);
  await expect(page.getByTestId('search-value')).toContainText('solid');

  await page.getByTestId('search-input').fill('router');
  await page.getByTestId('search-submit').click();
  await expect(page).toHaveURL(/\/search\?q=router$/);
  await expect(page.getByTestId('search-value')).toContainText('router');

  await page.getByTestId('search-clear').click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByTestId('search-value')).toContainText('none');

  await page.getByTestId('router-back').click();
  await expect(page).toHaveURL(/\/search\?q=router$/);
});

test('supports the dynamically registered pathless route', async ({ page }) => {
  await page.getByTestId('link-help').click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByTestId('page-help')).toBeVisible();
});
