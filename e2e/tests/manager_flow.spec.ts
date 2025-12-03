import { test, expect } from '@playwright/test';

// Helper to ensure unique data
const randomSuffix = () => Math.floor(Math.random() * 10000).toString();

test.describe('Manager Admin Flow', () => {

  // 1. SETUP: Login as Admin
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // MUI TextFields use labels that act as accessible names
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('pass'); // Adjust password if different

    // Click the Log In button
    await page.getByRole('button', { name: /log in/i }).click();

    // Verify successful login by checking for the Header
    await expect(page.getByText('Lares', { exact: true })).toBeVisible();
    await expect(page.getByText('LOG OUT')).toBeVisible();
  });

  test('Scenario 1: Create a new Employee with Keypad & Badge', async ({ page }) => {
    const newUsername = `employee_${randomSuffix()}`;

    // 1. Navigate to Users Page
    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByText('User Management')).toBeVisible();

    // 2. Open "ADD USER" Dialog
    await page.getByRole('button', { name: /add user/i }).click();

    // 3. Fill User Form
    // Note: ManageUser.tsx uses "Current password" label for the NEW user's password field
    await page.getByLabel('Username').fill(newUsername);
    await page.getByLabel('Current password').fill('UserPass123!');

    // 4. Select Role (Admin is default, let's pick User)
    // The role cards have click handlers. We find the one with text "User" and "No administrative privileges"
    await page.locator('div').filter({ hasText: /^UserNo administrative privileges$/ }).click();

    // 5. Check "Generate" for Keypad
    // The checkbox is inside a label that contains "Generate"
    // We target the specific checkbox associated with "Generate" text
    // Since there are two "Generate" texts (Keypad and Badge), we use order or specific structure.
    // Safe approach: Target the first "Generate" (Keypad) and second (Badge)
    const generateCheckboxes = page.getByRole('checkbox', { name: /generate/i });

    // Check Keypad
    await generateCheckboxes.first().check();
    // Check Badge
    await generateCheckboxes.nth(1).check();

    // 6. Submit
    await page.getByRole('button', { name: /submit/i }).click();

    // 7. Verify Success
    // Wait for the dialog to close and the new user to appear in the table
    await expect(page.getByRole('cell', { name: newUsername })).toBeVisible();

    // Optional: Check if the role badge is correct
    // We expect a chip with "User"
    await expect(page.getByRole('row', { name: newUsername }).getByText('User')).toBeVisible();
  });

  test('Scenario 2: Create a new Lock with multiple Auth Methods', async ({ page }) => {
    const lockName = `Server Room ${randomSuffix()}`;

    // 1. Navigate to Lock Page
    // Header.tsx uses the label "Lock" (singular)
    await page.getByRole('button', { name: 'Lock' }).click();

    // 2. Open "Add Lock" (Assuming there is a button named Add Lock based on ManageLock title logic)
    // You didn't paste LockPage.tsx, but usually it has an "Add Lock" button.
    // If not, adjust this selector.
    await page.getByRole('button', { name: /add lock/i }).click();

    // 3. Fill Lock Form
    await page.getByLabel('Lock Name').fill(lockName);
    await page.getByLabel('Description (optional)').fill('High security area');

    // 4. Select Auth Methods (MUI Select)
    // Click the Select dropdown
    await page.getByLabel('Auth Methods').click();
    // Click the options in the popup list
    await page.getByRole('option', { name: 'Badge' }).click();
    await page.getByRole('option', { name: 'Keypad' }).click();
    // Close the dropdown (click backdrop or press escape)
    await page.keyboard.press('Escape');

    // 5. Toggle Reservable
    await page.getByLabel('Reservable (Can be booked)').check();

    // 6. Save
    await page.getByRole('button', { name: /save/i }).click();

    // 7. Verify
    await expect(page.getByText(lockName)).toBeVisible();
  });

});
