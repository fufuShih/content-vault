import React, { useRef, useLayoutEffect, useState } from 'react';
import { useEpubInstance } from './useEpubInstance';
import { useEpubRendition } from './useEpubRendition';
import { ViewerToolbar } from './ViewerToolbar';
import  EPUBToc from './EPUBToc';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EPUBViewerProps } from './types';

const EPUBViewer: React.FC<EPUBViewerProps> = ({ 
  itemId, 
  onOutlineLoad,
  onTocGenerate 
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    if (viewerRef.current) {
      setViewerReady(true);
    }
  }, []);

  const {
    book,
    error,
    loadingStatus,
    toc
  } = useEpubInstance({
    itemId,
    viewerReady,
    onTocGenerate,
    onOutlineLoad
  });

  const {
    rendition,
    scale,
    setScale
  } = useEpubRendition({
    book,
    viewerRef,
    onLocationsReady: (total) => {
      setTotalPages(total);
      setIsLoading(false);
    }
  });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 10, 50));

  const goToNextPage = () => rendition?.next();
  const goToPrevPage = () => rendition?.prev();
  const goToLocation = (href: string) => rendition?.display(href);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 p-4">
          <p className="font-semibold">Error loading EPUB</p>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-xs mt-1 text-gray-500">Last status: {loadingStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ViewerToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        isLoading={isLoading}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <div className="flex-1 flex overflow-hidden">
        <div 
          className={`border-r bg-background transition-all ${
            sidebarCollapsed ? 'w-0' : 'w-64'
          }`}
        >
          {!sidebarCollapsed && toc.length > 0 && (
            <EPUBToc 
              toc={toc}
              onNavigate={goToLocation}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 bg-white">
          <div 
            ref={viewerRef}
            className="h-full w-full"
            key="viewer-container"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">{loadingStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EPUBViewer;
