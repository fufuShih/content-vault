import { useState, useCallback, useRef } from 'react';

export function usePDFNavigation(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [inputPage, setInputPage] = useState('1');
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const scrollToPage = useCallback((pageNum: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNum}"]`);
    if (pageElement && containerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    const page = Math.max(1, Math.min(pageNum, totalPages));
    setCurrentPage(page);
    setInputPage(page.toString());
    scrollToPage(page);
  }, [totalPages, scrollToPage]);

  const handlePageVisible = useCallback((pageNum: number) => {
    setVisiblePages(prev => new Set([...prev, pageNum]));
    setCurrentPage(pageNum);
    setInputPage(pageNum.toString());
  }, []);

  return {
    currentPage,
    scale,
    inputPage,
    visiblePages,
    containerRef,
    handleZoomIn,
    handleZoomOut,
    scrollToPage,
    goToPage,
    handlePageVisible,
    setInputPage,
    setVisiblePages,
  };
}
