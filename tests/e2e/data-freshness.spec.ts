import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
for(const width of [1440,390])test(`financial coverage and DATE_ONLY provenance are readable and safe at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/data');
 await expect(page.getByRole('heading',{name:'Financial data coverage'})).toBeVisible();
 await expect(page.getByText('1 / 1 securities have every required fact selected at the snapshot cutoff.')).toBeVisible();
 await expect(page.getByText(/Historical snapshot · READ ONLY/)).toBeVisible();
 await page.getByRole('link',{name:'run-ui-data',exact:true}).click();await expect(page).toHaveURL(/\/data\/run-ui-data$/);
 const summary=page.locator('summary').filter({hasText:/NET_INCOME.*DATE_ONLY/});await summary.focus();await page.keyboard.press('Enter');
 const detail=page.locator('#fact-observation-ui-data');await expect(detail.getByText('Exact issuer publishedAt').locator('..').locator('dd')).toHaveText('UNKNOWN / Unavailable');await expect(detail.getByText('Publication date (date-only)').locator('..').locator('dd')).toHaveText('2026-10-08');
 await expect(detail.getByRole('link',{name:'Open source document'})).toHaveAttribute('href','https://issuer.example/report.pdf');await expect(page.getByText(/PRIVATE-CREDENTIAL-ACCOUNT-CANARY/)).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await expect(page.getByRole('button',{name:/buy|execute|invest|fetch|approve/i})).toHaveCount(0);
 const directory=process.env.VN30_VALIDATION_VISUAL_DIRECTORY;if(directory){mkdirSync(directory,{recursive:true});await page.screenshot({path:path.join(directory,`${width}-fundamental-data-provenance.png`),fullPage:true});}
});
