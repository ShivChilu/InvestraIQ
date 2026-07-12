import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Onboarding E2E Verification Tests...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: First visit to Home Page -> Home Tour Auto-starts
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: First Visit Auto-starts Home Tour ---');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1500); // Wait for 900ms delay + mount

    let tooltip = await page.locator('.tour-tooltip-container').first();
    let isVisible = await tooltip.isVisible();
    if (!isVisible) throw new Error('FAIL: Home Tour tooltip is not visible on first load!');
    console.log('✓ PASS: Home Tour auto-started on first visit.');

    // Verify tooltip contents (controls presence)
    const titleText = await tooltip.locator('h3').textContent();
    console.log(`Tooltip Title: "${titleText}"`);
    if (!titleText.includes('Welcome to InvestraIQ')) throw new Error('FAIL: Tooltip title does not match Home Tour!');

    const endTourBtn = tooltip.locator('button:has-text("End Tour")');
    const prevBtn = tooltip.locator('button:has-text("Previous")');
    const nextBtn = tooltip.locator('button:has-text("Next")');

    if (!(await endTourBtn.isVisible())) throw new Error('FAIL: "End Tour" button is missing!');
    if (await prevBtn.isVisible()) throw new Error('FAIL: "Previous" button should be hidden on first step!');
    if (!(await nextBtn.isVisible())) throw new Error('FAIL: "Next" button is missing!');
    console.log('✓ PASS: Step controls verified (End Tour and Next present, Previous hidden).');

    // -------------------------------------------------------------
    // TEST 2: Refresh Home Page before completing -> Tour continues showing
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Page Refresh retains Home Tour ---');
    await page.reload();
    await page.waitForTimeout(1500);
    tooltip = await page.locator('.tour-tooltip-container').first();
    if (!(await tooltip.isVisible())) throw new Error('FAIL: Home Tour did not survive page refresh!');
    console.log('✓ PASS: Home Tour survives refresh.');

    // -------------------------------------------------------------
    // TEST 3: Click "End Tour" -> closes tour and flags as completed
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: End Tour closes and writes completion flag ---');
    await page.locator('button:has-text("End Tour")').click();
    await page.waitForTimeout(500);
    if (await page.locator('.tour-tooltip-container').isVisible()) throw new Error('FAIL: Tooltip is still visible after End Tour click!');

    // Check localStorage
    const homeCompleted = await page.evaluate(() => localStorage.getItem('onboarding_home_completed'));
    if (homeCompleted !== 'true') throw new Error(`FAIL: onboarding_home_completed should be "true", got "${homeCompleted}"`);
    console.log('✓ PASS: End Tour closed the tour and set onboarding_home_completed flag in localStorage.');

    // -------------------------------------------------------------
    // TEST 4: Visit Home Page again -> Does NOT auto-start
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Home Page revisit does NOT auto-start ---');
    await page.reload();
    await page.waitForTimeout(1500);
    if (await page.locator('.tour-tooltip-container').isVisible()) throw new Error('FAIL: Home Tour auto-started on revisit after completion!');
    console.log('✓ PASS: Home Tour bypassed successfully on revisit.');

    // -------------------------------------------------------------
    // TEST 5: Manual "Start Tour" Button Override on Home Page
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Manual Start Tour Button Override on Home ---');
    await page.locator('button:has-text("Start Tour")').click();
    await page.waitForTimeout(500);
    tooltip = await page.locator('.tour-tooltip-container').first();
    if (!(await tooltip.isVisible())) throw new Error('FAIL: Manual launch failed to force start the tour!');
    console.log('✓ PASS: Manual Start Tour button forced Home Tour to launch.');

    // End it again
    await page.locator('button:has-text("End Tour")').click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // TEST 6: First Company Analysis -> Dashboard Tour Auto-starts
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: First Analysis auto-starts Dashboard Tour ---');
    await page.locator('#tour-search-bar input').first().fill('Apple Inc.');
    await page.keyboard.press('Enter');
    console.log('Running analysis pipeline (waiting for completion)...');
    
    // Wait for the dashboard header/score widget to mount (indicating analysis finished)
    await page.waitForSelector('#tour-asset-summary', { timeout: 90000 });
    console.log('✓ Analysis finished. Dashboard rendered. Waiting for tour auto-start...');
    await page.waitForTimeout(1500);

    tooltip = await page.locator('.tour-tooltip-container').first();
    if (!(await tooltip.isVisible())) throw new Error('FAIL: Dashboard Tour did not auto-start after first analysis!');
    
    const dbTitleText = await tooltip.locator('h3').textContent();
    console.log(`Tooltip Title: "${dbTitleText}"`);
    if (!dbTitleText.includes('Analysis Dashboard Tour')) throw new Error('FAIL: Tooltip does not match Dashboard Tour!');
    console.log('✓ PASS: Dashboard Tour auto-started after first successful analysis.');

    // -------------------------------------------------------------
    // TEST 7: Dashboard refresh before completion -> Tour survives
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Dashboard refresh retains Dashboard Tour ---');
    await page.reload();
    await page.waitForTimeout(1500);
    tooltip = await page.locator('.tour-tooltip-container').first();
    if (!(await tooltip.isVisible())) throw new Error('FAIL: Dashboard Tour did not survive refresh!');
    console.log('✓ PASS: Dashboard Tour survives dashboard page refresh.');

    // -------------------------------------------------------------
    // TEST 8: Dashboard "End Tour" -> closes and flags as completed
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Dashboard End Tour closes and flags completed ---');
    await page.locator('button:has-text("End Tour")').click();
    await page.waitForTimeout(500);
    if (await page.locator('.tour-tooltip-container').isVisible()) throw new Error('FAIL: Dashboard tooltip still visible after End Tour click!');

    const dbCompleted = await page.evaluate(() => localStorage.getItem('onboarding_dashboard_completed'));
    if (dbCompleted !== 'true') throw new Error(`FAIL: onboarding_dashboard_completed should be "true", got "${dbCompleted}"`);
    console.log('✓ PASS: Dashboard Tour closed and marked completed.');

    // -------------------------------------------------------------
    // TEST 9: Search another company -> Does NOT auto-start dashboard tour
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Subsequent search does NOT auto-start dashboard tour ---');
    // Return to search console
    await page.locator('button:has-text("Return to Search Console")').click();
    await page.waitForTimeout(1500); // Check that home tour doesn't trigger
    if (await page.locator('.tour-tooltip-container').isVisible()) throw new Error('FAIL: Home Tour auto-started when returning to search page!');
    console.log('✓ PASS: Home Tour remained bypassed upon returning.');

    // Search another company
    await page.locator('#tour-search-bar input').first().fill('Tesla Inc.');
    await page.keyboard.press('Enter');
    console.log('Running second analysis pipeline...');
    await page.waitForSelector('#tour-asset-summary', { timeout: 90000 });
    await page.waitForTimeout(1500);

    if (await page.locator('.tour-tooltip-container').isVisible()) throw new Error('FAIL: Dashboard Tour auto-started on subsequent company search!');
    console.log('✓ PASS: Dashboard Tour remained bypassed on subsequent searches.');

    // -------------------------------------------------------------
    // TEST 10: Manual Override on Dashboard Page
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Manual Start Tour Button Override on Dashboard ---');
    await page.locator('button:has-text("Start Tour")').click();
    await page.waitForTimeout(500);
    tooltip = await page.locator('.tour-tooltip-container').first();
    if (!(await tooltip.isVisible())) throw new Error('FAIL: Manual launch failed to force dashboard tour!');
    console.log('✓ PASS: Manual Start Tour button forced Dashboard Tour to launch.');

    // End it
    await page.locator('button:has-text("End Tour")').click();
    await page.waitForTimeout(500);

    console.log('\n🌟 ALL 10 E2E ONBOARDING TESTS COMPLETED SUCCESSFULLY! 🌟');
  } catch (err) {
    console.error('\n❌ TEST SUITE RUN FAILURE:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
