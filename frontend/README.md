# Prelegal frontend

Next.js app for drafting legal agreements from the CommonPaper templates in `../templates`.
It builds to a static export in `out/`, which the FastAPI backend will serve.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm start          # serve out/ locally
npm test           # unit and component tests (Vitest)
npm run test:e2e   # build, then Playwright tests against out/
npm run lint
npm run typecheck
```

Before the first `test:e2e`, install the browser with `npx playwright install chromium`.

## Layout

- `src/lib/engine/` is the document model, the template markdown parser and field formatting. It knows nothing about any one document.
- `src/lib/documents/` holds one definition per document type: its form fields and its sections, either written in code or parsed from a template at build time.
- `src/components/` has the generated form, the live HTML preview and the download button.
- `src/lib/pdf/` renders the same model to PDF with react-pdf. It is only loaded when someone downloads.

To add a document type, write a definition like `src/lib/documents/mutual-nda.ts` and load it with `loadDocumentModel` in a page.
