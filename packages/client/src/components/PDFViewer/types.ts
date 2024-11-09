import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export interface TocItem {
  title: string;
  pageIndex: number;
  children?: TocItem[];
}

export interface PDFViewerProps {
  itemId: number;
  onOutlineLoad?: (hasOutline: boolean) => void;
  onTocGenerate?: (toc: TocItem[]) => void;
}

export interface PDFOutlineNode {
  title: string;
  bold: boolean;
  italic: boolean;
  color: Uint8ClampedArray;
  dest: string | unknown[] | null;
  url: string | null;
  unsafeUrl: string | undefined;
  newWindow: boolean | undefined;
  count: number | undefined;
  items: PDFOutlineNode[];
}

export interface PDFPageProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onVisible?: () => void;
}
