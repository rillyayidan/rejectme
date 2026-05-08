// lib/pdf-parser.ts

export async function parsePdfToText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item) => {
        if ("str" in item) return item.str;
        return "";
      })
      .join(" ");

    fullText += `\n\n--- PAGE ${pageNumber} ---\n${pageText}`;
  }

  return fullText.trim();
}