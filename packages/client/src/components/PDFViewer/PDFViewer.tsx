import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash-es';
import { PDFViewerProps } from './types';
import { PDFPage } from './PDFPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import PDFToc from './PDFToc';
import { usePDFDocument } from './usePDFDocument';
import { usePDFNavigation } from './usePDFNavigation';
import { PDFToolbar } from './PDFToolbar';
import { useTTS } from './useTTS';

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  itemId, 
  onOutlineLoad,
  onTocGenerate 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageText, setPageText] = useState<string>('');
  const { isPlaying, speak, stop } = useTTS();
  const {
    isLoading,
    error,
    pdfDoc,
    totalPages,
    hasOutline,
    pdfOutline,
  } = usePDFDocument(itemId, onOutlineLoad, onTocGenerate);

  const {
    currentPage,
    scale,
    inputPage,
    visiblePages,
    containerRef,
    handleZoomIn,
    handleZoomOut,
    goToPage,
    handlePageVisible,
    setInputPage,
    setVisiblePages,
  } = usePDFNavigation(totalPages);

  const handleScroll = debounce(() => {
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
  }, 100);

  const handleTtsToggle = async () => {
    if (isPlaying) {
      stop();
    } else if (pdfDoc) {
      if (!pageText) {
        const page = await pdfDoc.getPage(currentPage);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        setPageText(text);
        speak(text);
      } else {
        speak(pageText);
      }
    }
  };

  useEffect(() => {
    setPageText('');
  }, [currentPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef, handleScroll]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <PDFToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        inputPage={inputPage}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onPageChange={goToPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onInputPageChange={setInputPage}
        isPlaying={isPlaying}
        onTtsToggle={handleTtsToggle}
      />

      {/* Rest of the component remains the same */}
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
