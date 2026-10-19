import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";

const preview = (page: Page) =>
  page.getByRole("article", { name: "Mutual Non-Disclosure Agreement" });
const party = (page: Page, n: 1 | 2) => page.getByRole("group", { name: `Party ${n}` });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-18T10:00:00"));
});

test("fills in the NDA live as the user types", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
  await expect(preview(page).locator('[data-field="effectiveDate"]')).toHaveText("October 18, 2026");
  await expect(preview(page).locator('mark[data-field="governingLaw"]')).toHaveText(
    "[Governing Law]",
  );

  await page.getByLabel("Governing Law").fill("Delaware");
  await party(page, 1).getByLabel("Company").fill("Acme Corp");
  await party(page, 2).getByLabel("Print Name").fill("Grace Hopper");

  await expect(preview(page).locator("#term-governing-law")).toHaveText("Governing Law: Delaware");
  await expect(preview(page).locator('[data-field="party1Company"]')).toHaveText("Acme Corp");
  await expect(preview(page).locator('[data-field="party2Name"]')).toHaveText("Grace Hopper");
  expect(errors).toEqual([]);
});

test("switching the MNDA term updates the form and the document", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Years until the MNDA expires")).toBeVisible();

  await page.getByLabel("Continues until terminated").check();

  await expect(page.getByLabel("Years until the MNDA expires")).toBeHidden();
  const option = preview(page)
    .getByRole("listitem")
    .filter({ hasText: "Continues until terminated in accordance with the terms of the MNDA." });
  await expect(option.locator(".sr-only")).toHaveText("Selected:");
});

test("defined terms in the standard terms jump to their cover-page values", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Jurisdiction").fill("New Castle, DE");

  await preview(page).getByRole("link", { name: "Jurisdiction" }).first().click();

  await expect(page).toHaveURL(/#term-jurisdiction$/);
  await expect(preview(page).locator("#term-jurisdiction")).toBeInViewport();
});

test("downloads the completed NDA as a PDF", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Governing Law").fill("Delaware");
  await party(page, 1).getByLabel("Company").fill("Acme Corp");
  await party(page, 2).getByLabel("Company").fill("Globex Inc");

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadEvent;

  expect(download.suggestedFilename()).toBe("Mutual-NDA.pdf");
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  const { text } = await extractText(await getDocumentProxy(new Uint8Array(bytes)), {
    mergePages: true,
  });
  expect(text).toContain("Governing Law: Delaware");
  expect(text).toContain("Acme Corp");
  expect(text).toContain("Globex Inc");
  expect(text).toContain("October 18, 2026");
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeEnabled();
});

test("stacks the form above the preview on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const form = await page.getByRole("region", { name: "Agreement details" }).boundingBox();
  const previewPane = await page.getByRole("region", { name: "Document preview" }).boundingBox();
  expect(form && previewPane && previewPane.y >= form.y + form.height - 1).toBe(true);
  expect(previewPane?.width).toBeLessThanOrEqual(390);
});
