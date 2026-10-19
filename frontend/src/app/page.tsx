import { DocumentWorkbench } from "@/components/DocumentWorkbench";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { loadDocumentModel } from "@/lib/engine/load";

export default function Home() {
  // Runs at build time: the template is read from disk and baked into the static page
  const model = loadDocumentModel(mutualNda);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight text-navy">
          <span aria-hidden className="size-3 rounded-sm bg-accent" />
          Prelegal
        </span>
        <span aria-hidden className="h-5 w-px bg-slate-300" />
        <h1 className="font-semibold text-navy">Mutual NDA Creator</h1>
      </header>
      <DocumentWorkbench model={model} />
    </>
  );
}
