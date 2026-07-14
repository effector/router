import { expect, test } from '@playwright/test';

test('renders lazy route and nested settings router', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByTestId('page-reports')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute(
    'data-reports-mounted',
    'true',
  );

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByTestId('settings-general')).toBeVisible();

  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/settings\/profile$/);
  await expect(page.getByTestId('settings-profile')).toBeVisible();
});

test('guards a route and recovers after authorization changes', async ({
  page,
}) => {
  await page.goto('/protected');
  await expect(page).toHaveURL(/\/protected$/);
  await expect(page.getByTestId('page-not-found')).toBeVisible();

  await page.getByTestId('toggle-auth').click();
  await page.getByTestId('retry-protected').click();
  await expect(page.getByTestId('page-protected')).toBeVisible();
  await expect(page.getByTestId('auth-state')).toContainText('enabled');
});

test('uses a query-backed modal router without changing the host path', async ({
  page,
}) => {
  await page.goto('/projects/solid?sort=asc');
  await page.getByTestId('open-modal').click();
  await expect(page).toHaveURL(
    /\/projects\/solid\?sort=asc&modal=%2Ftask%2Froute-contracts$/,
  );
  await expect(page.getByTestId('task-modal')).toContainText('Route contracts');

  await page.getByTestId('close-modal').click();
  await expect(page).toHaveURL(/\/projects\/solid\?sort=asc$/);
  await expect(page.getByTestId('task-modal')).toBeHidden();
});

test('opens and closes a virtual drawer route', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-drawer').click();
  await expect(page.getByTestId('activity-drawer')).toContainText('activity');
  await page.getByTestId('close-drawer').click();
  await expect(page.getByTestId('activity-drawer')).toBeHidden();
});

test('falls back for an unknown URL and supports direct refresh paths', async ({
  page,
}) => {
  await page.goto('/does-not-exist');
  await expect(page.getByTestId('page-not-found')).toBeVisible();

  await page.goto('/projects/router/tasks/route-contracts');
  await expect(page.getByTestId('project-task')).toContainText(
    'Route contracts',
  );
  await page.reload();
  await expect(page.getByTestId('project-task')).toContainText(
    'Route contracts',
  );
});
