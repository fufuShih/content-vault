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
  const renditionRef = useRef<any>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(100);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const initializeReader = async () => {
      if (!viewerRef.current) return;
      
      try {
        setIsLoading(true);
        setLoadingStatus('Fetching EPUB file...');
        
        const epubUrl = `/api/items/${itemId}/resource`;
        const response = await fetch(epubUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load EPUB: ${response.statusText}`);
        }

        // Log response headers
        console.log('Response headers:', 
          Array.from(response.headers.entries())
            .reduce((obj, [key, value]) => ({...obj, [key]: value}), {})
        );

        setLoadingStatus('Processing EPUB data...');
        const arrayBuffer = await response.arrayBuffer();
        
        // Log file size
        console.log('File size:', arrayBuffer.byteLength, 'bytes');

        if (arrayBuffer.byteLength === 0) {
          throw new Error('Received empty file');
        }

        setLoadingStatus('Creating EPUB instance...');
        const newBook = ePub();
        
        setLoadingStatus('Opening EPUB file...');
        await newBook.open(arrayBuffer);
        setBook(newBook);

        setLoadingStatus('Creating viewer...');
        const rendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
          minSpreadWidth: 1000
        });
        
        renditionRef.current = rendition;

        // 設置字體大小
        rendition.hooks.content.register((contents: any) => {
          if (contents.documentElement) {
            contents.documentElement.style.fontSize = `${scale}%`;
          }
        });

        setLoadingStatus('Loading content...');
        await rendition.display();

        setLoadingStatus('Loading table of contents...');
        const navigation = await newBook.navigation.load();
        const tocItems = navigation.toc.map((item: any) => ({
          label: item.label,
          href: item.href,
          subitems: item.subitems?.map((subitem: any) => ({
            label: subitem.label,
            href: subitem.href,
          }))
        }));

        setToc(tocItems);
        onTocGenerate?.(tocItems);
        onOutlineLoad?.(tocItems.length > 0);

        setLoadingStatus('Generating pages...');
        await newBook.locations.generate(1024);
        setTotalPages(newBook.locations.total || 1);

        rendition.on('relocated', (location: any) => {
          const page = newBook.locations.locationFromCfi(location.start.cfi);
          setCurrentPage(page || 0);
        });

        setIsLoading(false);
        setLoadingStatus('');

      } catch (err) {
        console.error('Error initializing EPUB reader:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize EPUB reader');
        setLoadingStatus('Error occurred');
      }
    };

    initializeReader();

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch (e) {
          console.warn('Error cleaning up rendition:', e);
        }
      }
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn('Error cleaning up book:', e);
        }
      }
    };
  }, [itemId, onOutlineLoad, onTocGenerate]);

  // Scale change effect
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.hooks.content.clear();
      renditionRef.current.hooks.content.register((contents: any) => {
        if (contents.documentElement) {
          contents.documentElement.style.fontSize = `${scale}%`;
        }
      });
      renditionRef.current.reload();
    }
  }, [scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 10, 50));

  const goToNextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const goToPrevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const goToLocation = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
    }
  };

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
              disabled={currentPage <= 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="min-w-[80px] text-center">
              {currentPage + 1} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 50 || isLoading}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center">{scale}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 200 || isLoading}
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

        <div className="flex-1 min-w-0 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500">{loadingStatus}</p>
            </div>
          ) : (
            <div 
              ref={viewerRef}
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EPUBViewer;
