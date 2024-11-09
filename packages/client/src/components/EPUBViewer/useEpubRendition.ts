import { useRef, useEffect, useState } from 'react';
import { Book } from 'epubjs';

interface UseEpubRenditionProps {
  book: Book | null;
  viewerRef: React.RefObject<HTMLDivElement>;
  onLocationsReady?: (total: number) => void;
}

export const useEpubRendition = ({
  book,
  viewerRef,
  onLocationsReady
}: UseEpubRenditionProps) => {
  const renditionRef = useRef<any>(null);
  const [scale, setScale] = useState(100);

  useEffect(() => {
    if (!book || !viewerRef.current) return;

    const initializeRendition = async () => {
      const rendition = book.renderTo(viewerRef.current!, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated',
        minSpreadWidth: 1000
      });
      
      renditionRef.current = rendition;

      try {
        await Promise.race([
          new Promise((resolve) => {
            if (rendition.hooks?.ready) {
              rendition.hooks.ready.register(resolve);
            } else {
              resolve(undefined);
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Rendition ready timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('Rendition ready warning:', error);
      }

      await rendition.display();

      try {
        await book.locations.generate(1024);
        onLocationsReady?.(book.locations.total || 1);
      } catch (error) {
        console.warn('Error generating locations:', error);
        onLocationsReady?.(1);
      }
    };

    initializeRendition();

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch (e) {
          console.warn('Error cleaning up rendition:', e);
        }
      }
    };
  }, [book]);

  // Scale handling
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

  return {
    rendition: renditionRef.current,
    scale,
    setScale
  };
};
