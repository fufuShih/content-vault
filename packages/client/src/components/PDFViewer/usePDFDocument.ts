import { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFOutlineNode, TocItem } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

export function usePDFDocument(itemId: number, onOutlineLoad?: (hasOutline: boolean) => void, onTocGenerate?: (toc: TocItem[]) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [hasOutline, setHasOutline] = useState(false);
  const [pdfOutline, setPdfOutline] = useState<TocItem[]>([]);

  const getPdfUrl = useCallback(() => {
    return `http://localhost:3000/api/items/${itemId}/resource`;
  }, [itemId]);

  const extractOutline = useCallback(async (pdf: PDFDocumentProxy) => {
    try {
      const outline = await pdf.getOutline();
      if (outline) {
        const tocItems = await Promise.all(
          outline.map(async (item: PDFOutlineNode) => {
            if (typeof item.dest !== 'string') return null;
            const dest = await pdf.getDestination(item.dest);
            if (!dest) return null;
            const pageIndex = await pdf.getPageIndex(dest[0]);
            
            let children = undefined;
            if (item.items && item.items.length > 0) {
              children = (await Promise.all(
                item.items.map(async (child: PDFOutlineNode) => {
                  if (typeof child.dest !== 'string') return null;
                  const childDest = await pdf.getDestination(child.dest);
                  if (!childDest) return null;
                  const childPageIndex = await pdf.getPageIndex(childDest[0]);
                  return {
                    title: child.title,
                    pageIndex: childPageIndex,
                  };
                })
              )).filter((child): child is { title: string; pageIndex: number; } => child !== null);
            }

            return {
              title: item.title,
              pageIndex: pageIndex,
              children,
            };
          })
        );
        
        const validTocItems = tocItems.filter((item): item is NonNullable<typeof item> => item !== null);
        onTocGenerate?.(validTocItems);
        onOutlineLoad?.(true);
        setPdfOutline(validTocItems);
        setHasOutline(true);
      } else {
        onOutlineLoad?.(false);
      }
    } catch (error) {
      console.error('Error extracting outline:', error);
      onOutlineLoad?.(false);
    }
  }, [onTocGenerate, onOutlineLoad]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const pdf = await pdfjsLib.getDocument(getPdfUrl()).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await extractOutline(pdf);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [extractOutline, getPdfUrl, itemId]);

  return {
    isLoading,
    error,
    pdfDoc,
    totalPages,
    hasOutline,
    pdfOutline,
  };
}
