import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 設置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  scale?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, scale = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    if (url) {
      loadPDF();
    }
  }, [url, scale]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 rounded-lg shadow-lg">
      <canvas 
        ref={canvasRef}
        className="mx-auto"
      />
    </div>
  );
};

export default PDFViewer;
