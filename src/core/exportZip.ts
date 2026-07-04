import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { GeneratedFile } from './telegram';

export async function saveMarkdownFile(file: GeneratedFile): Promise<void> {
  const blob = new Blob([file.content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, file.filename);
}

export async function saveZip(files: GeneratedFile[], archiveName: string): Promise<void> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${archiveName}.zip`);
}
