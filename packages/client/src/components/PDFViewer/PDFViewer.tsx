import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { debounce } from 'lodash-es';
import { PDFOutlineNode, PDFViewerProps } from './types';
import { PDFPage } from './PDFPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import PDFToc, { TOCItem } from './PDFToc';

pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasOutline, setHasOutline] = useState(false);
  const [pdfOutline, setPdfOutline] = useState<TOCItem[]>([]);

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

  useEffect(() => { // Load the PDF document when the component mounts
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
      setVisiblePages(prev => new Set([...new Set([...prev, currentPage])].sort((a, b) => a - b)));
    }
  }, [currentPage]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 border-b flex items-center px-4 bg-background">
        <div className="flex-1 flex items-center">
          <Button
            id="sidebar-toggle"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-4">
          <div id="page-controls" className="flex items-center gap-2">
            <Button
              id="prev-page"
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                id="page-input"
                type="text"
                value={inputPage}
                onChange={handlePageInputChange}
                className="w-16 text-center"
              />
              <span>/ {totalPages}</span>
            </div>

            <Button
              id="next-page"
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div id="zoom-controls" className="flex items-center gap-2">
            <Button
              id="zoom-out"
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span id="zoom-level">{Math.round(scale * 100)}%</span>
            <Button
              id="zoom-in"
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div 
          className={`border-r bg-background transition-all ${
            sidebarCollapsed ? 'w-0' : 'w-64'
          }`}
        >
          {!sidebarCollapsed && hasOutline && (
            <PDFToc 
              outline={pdfOutline}
              currentPage={currentPage}
              onPageChange={(pageIndex) => goToPage(pageIndex + 1)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div 
            ref={containerRef}
            className="relative flex-1 w-full max-h-full overflow-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-[800px]">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {isPageLoading && (
                  <div className="fixed top-4 right-4">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default PDFViewer;
