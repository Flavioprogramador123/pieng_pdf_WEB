import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

/**
 * DOCX simples no navegador (texto por página).
 * Não preserva layout/imagens como pdf2docx no servidor.
 */
export async function downloadSimpleDocx(pdfFilename, sections) {
  const children = sections.flatMap((s) => [
    new Paragraph({
      text: s.title,
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      children: [new TextRun(s.text || "(sem texto detectável nesta página)")],
    }),
    new Paragraph({ text: "" }),
  ]);

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const base = (pdfFilename || "documento").replace(/\.pdf$/i, "");
  const name = `${base}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return name;
}

export async function extractPageTexts(pdf, pageSpecs) {
  const sections = [];
  for (let i = 0; i < pageSpecs.length; i++) {
    const spec = pageSpecs[i];
    const page = await pdf.getPage(spec.page);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => it.str).join(" ").trim();
    sections.push({
      title: `Página ${i + 1}`,
      text,
    });
  }
  return sections;
}
