import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// 設置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

interface PDFViewerProps {
  itemId: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ itemId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);

  // PDF URL 生成函數
  const getPdfUrl = () => {
    return `http://localhost:3000/api/items/${itemId}/resource`;
  };

  // 載入 PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const pdf = await pdfjsLib.getDocument(getPdfUrl()).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [itemId]);

  // 渲染 PDF 頁面
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

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleZoomOut}>-</Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" onClick={handleZoomIn}>+</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-[600px] h-[800px]" />
          </div>
        ) : (
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
