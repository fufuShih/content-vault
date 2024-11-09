import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { Skeleton } from "@/components/ui/skeleton";
import PDFToc from './PDFToc';

pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

interface PDFViewerProps {
  itemId: number;
  onOutlineLoad?: (hasOutline: boolean) => void;
  onTocGenerate?: (toc: any[]) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  itemId, 
  onOutlineLoad,
  onTocGenerate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const scale = 1.5;
  const getPdfUrl = () => {
    return `http://localhost:3000/api/items/${itemId}/resource`;
  };

  const extractOutline = async (pdf: PDFDocumentProxy) => {
    try {
      const outline = await pdf.getOutline();
      if (outline) {
        const tocItems = await Promise.all(
          outline.map(async (item: any) => {
            const dest = await pdf.getDestination(item.dest);
            const pageIndex = await pdf.getPageIndex(dest[0]);
            
            let children = undefined;
            if (item.items && item.items.length > 0) {
              children = await Promise.all(
                item.items.map(async (child: any) => {
                  const childDest = await pdf.getDestination(child.dest);
                  const childPageIndex = await pdf.getPageIndex(childDest[0]);
                  return {
                    title: child.title,
                    pageIndex: childPageIndex,
                  };
                })
              );
            }

            return {
              title: item.title,
              pageIndex: pageIndex,
              children,
            };
          })
        );
        
        onTocGenerate?.(tocItems);
        onOutlineLoad?.(true);
      } else {
        onOutlineLoad?.(false);
      }
    } catch (error) {
      console.error('Error extracting outline:', error);
      onOutlineLoad?.(false);
    }
  };

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const pdf = await pdfjsLib.getDocument(getPdfUrl()).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        await extractOutline(pdf);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [itemId]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render page');
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex + 1);
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="h-full flex justify-center">
      <div className="relative max-h-full overflow-auto">
        {isLoading ? (
          <Skeleton className="w-[600px] h-[800px]" />
        ) : (
          <canvas ref={canvasRef} className="shadow-lg" />
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
