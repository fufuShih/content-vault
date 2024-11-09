import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { debounce } from 'lodash-es';

pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

interface TocItem {
  title: string;
  pageIndex: number;
  children?: TocItem[];
}

interface PDFViewerProps {
  itemId: number;
  onOutlineLoad?: (hasOutline: boolean) => void;
  onTocGenerate?: (toc: TocItem[]) => void;
}

interface PDFPageProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onVisible?: () => void;
}

const PDFPage: React.FC<PDFPageProps> = ({ pdfDoc, pageNumber, scale, onVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5, // 當頁面50%可見時觸發
    onChange: (inView) => {
      if (inView) {
        onVisible?.();
      }
    }
  });

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current) return;
      try {
        setIsLoading(true);
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport
        }).promise;
      } catch (err) {
        console.error(`Error rendering page ${pageNumber}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div ref={ref} className="relative mb-4">
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      )}
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  );
};

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
  const [scale, setScale] = useState(1.5);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [inputPage, setInputPage] = useState('1');
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const containerRef = useRef<HTMLDivElement>(null);

  const getPdfUrl = useCallback(() => {
    return `http://localhost:3000/api/items/${itemId}/resource`;
  }, [itemId]);

  const extractOutline = useCallback(async (pdf: PDFDocumentProxy) => {
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
  }, [onTocGenerate, onOutlineLoad]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const goToPage = (pageNum: number) => {
    const page = Math.max(1, Math.min(pageNum, totalPages));
    setCurrentPage(page);
    setInputPage(page.toString());
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputPage(value);
    const pageNum = parseInt(value);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
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
  }, [extractOutline, getPdfUrl, itemId]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setIsPageLoading(true);
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

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
      } finally {
        setIsPageLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const handlePageVisible = useCallback((pageNum: number) => {
    setVisiblePages(prev => new Set([...prev, pageNum]));
    // 更新currentPage為目前可見頁面中最小的數字
    setCurrentPage(pageNum);
    setInputPage(pageNum.toString());
  }, []);

  const handleScroll = useCallback(
    debounce(() => {
      if (!containerRef.current || !pdfDoc) return;
      
      const container = containerRef.current;
      const { scrollTop, clientHeight } = container;
      const bottomThreshold = scrollTop + clientHeight;
      
      if (bottomThreshold > container.scrollHeight - 1000) {
        const lastPage = Math.max(...Array.from(visiblePages));
        if (lastPage < totalPages) {
          setVisiblePages(prev => new Set([...prev, lastPage + 1]));
        }
      }
    }, 100),
    [pdfDoc, totalPages, visiblePages]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Update visible pages when current page changes
  useEffect(() => {
    if (currentPage) {
      setVisiblePages(prev => [...new Set([...prev, currentPage])].sort((a, b) => a - b));
    }
  }, [currentPage]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col items-center">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputPage}
            onChange={handlePageInputChange}
            className="w-16 text-center"
          />
          <span>/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span>{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 w-full max-h-full overflow-auto"
      >
        {isLoading ? (
          <Skeleton className="w-[600px] h-[800px]" />
        ) : (
          <div className="flex flex-col items-center">
            {Array.from(visiblePages).sort((a, b) => a - b).map((pageNum) => (
              <PDFPage
                key={pageNum}
                pdfDoc={pdfDoc!}
                pageNumber={pageNum}
                scale={scale}
                onVisible={() => handlePageVisible(pageNum)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
