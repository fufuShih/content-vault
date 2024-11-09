import React, { useRef, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { PDFPageProps } from './types';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { RenderTask } from 'pdfjs-dist/types/src/display/api';

export const PDFPage: React.FC<PDFPageProps> = ({ pdfDoc, pageNumber, scale, onVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView) {
        onVisible?.();
      }
    }
  });

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current) return;

      try {
        // 取消之前的渲染任務
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        // 如果組件已卸載，不繼續執行
        if (!isMounted) return;

        setIsLoading(true);
        const page = await pdfDoc.getPage(pageNumber);
        
        // 再次檢查組件是否還在
        if (!isMounted || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 清除畫布
        context.clearRect(0, 0, canvas.width, canvas.height);

        // 創建新的渲染任務
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport,
          intent: 'print' // 添加這個選項可能有助於提高渲染穩定性
        });

        await renderTaskRef.current.promise;
        
        // 最後一次檢查組件狀態
        if (!isMounted) return;
        
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 使用 setTimeout 來確保在 DOM 更新後執行渲染
    const timeoutId = setTimeout(renderPage, 0);

    // 清理函數
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div 
      ref={ref}
      data-page={pageNumber}
      className="relative mb-4"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      )}
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  );
};
