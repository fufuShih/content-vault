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

export interface PDFPageProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onVisible?: () => void;
}
