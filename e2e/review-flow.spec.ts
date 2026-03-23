import { expect, test } from '@playwright/test';

test('manual create -> review -> stats refresh', async ({ page }) => {
  await page.goto('/login');

  await page.getByTestId('login-username').fill('reviewer-01');
  await page.getByTestId('login-password').fill('123456');
  await page.getByTestId('login-role').selectOption('reviewer');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/reviews$/);

  await page.getByTestId('open-manual-qa-form').click();
  await page.getByTestId('manual-qa-question').fill('人工补录的 GAA 问题是什么？');
  await page.getByTestId('manual-qa-answer').fill('这是一个通过 Playwright 补录并审核的示例答案。');
  await page.getByTestId('manual-qa-topics').fill('器件物理, 自动化测试');
  await page.getByTestId('manual-qa-scenes').fill('engineer, researcher');
  await page.getByTestId('manual-qa-notes').fill('E2E 自动化创建的待审核数据');
  await page.getByTestId('manual-qa-fragment').fill('这是自动化测试生成的参考片段。');
  await page.getByTestId('manual-qa-submit').click();

  await expect(page).toHaveURL(/\/reviews\/qa-manual-/);
  await page.getByTestId('review-submit').click();

  await expect(page).toHaveURL(/\/reviews$/);
  await page.getByRole('link', { name: '统计面板' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId('stats-reviewed')).toContainText('1');
});
