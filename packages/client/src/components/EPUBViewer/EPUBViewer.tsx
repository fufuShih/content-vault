import React, { useState, useEffect, useRef } from 'react';
import ePub, { Book } from 'epubjs';
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EPUBViewerProps, TOCItem } from './types';
import EPUBToc from './EPUBToc';

const EPUBViewer: React.FC<EPUBViewerProps> = ({ 
  itemId, 
  onOutlineLoad,
  onTocGenerate 
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(100);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const initializeReader = async () => {
      try {
        setIsLoading(true);
        const epubUrl = `http://localhost:3000/api/items/${itemId}/resource`;
        const book = ePub(epubUrl);
        
        await book.ready;
        setBook(book);

        if (viewerRef.current) {
          const rendition = book.renderTo(viewerRef.current, {
            width: '100%',
            height: '100%',
            spread: 'none'
          });

          await rendition.display();

          // Load TOC
          const navigation = await book.navigation.load();
          const tocItems = navigation.toc.map(item => ({
            label: item.label,
            href: item.href,
            subitems: item.subitems?.map(subitem => ({
              label: subitem.label,
              href: subitem.href,
            }))
          }));

          setToc(tocItems);
          onTocGenerate?.(tocItems);
          onOutlineLoad?.(tocItems.length > 0);

          // Calculate total pages
          const locations = await book.locations.generate(1024);
          const totalLocs = book.locations.total;
          setTotalPages(totalLocs);
        }
      } catch (err) {
        console.error('Error loading EPUB:', err);
        setError('Failed to load EPUB');
      } finally {
        setIsLoading(false);
      }
    };

    initializeReader();

    return () => {
      if (book) {
        book.destroy();
      }
    };
  }, [itemId, onOutlineLoad, onTocGenerate]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 10, 50));

  const goToNextPage = () => {
    if (book && book.rendition) {
      book.rendition.next();
      setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }
  };

  const goToPrevPage = () => {
    if (book && book.rendition) {
      book.rendition.prev();
      setCurrentPage(prev => Math.max(prev - 1, 0));
    }
  };

  const goToLocation = (href: string) => {
    if (book && book.rendition) {
      book.rendition.display(href);
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 border-b flex items-center px-4 bg-background">
        <div className="flex-1 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span>{currentPage + 1} / {totalPages}</span>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 50}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span>{scale}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 200}
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
          {!sidebarCollapsed && toc.length > 0 && (
            <EPUBToc 
              toc={toc}
              onNavigate={goToLocation}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div 
              ref={viewerRef}
              className="h-full"
              style={{
                fontSize: `${scale}%`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EPUBViewer;
