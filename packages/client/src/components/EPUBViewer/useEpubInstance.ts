import { useState, useEffect } from 'react';
import ePub, { Book } from 'epubjs';
import { TOCItem } from './types';

interface UseEpubInstanceProps {
  itemId: string;
  viewerReady: boolean;
  onTocGenerate?: (toc: TOCItem[]) => void;
  onOutlineLoad?: (hasOutline: boolean) => void;
}

export const useEpubInstance = ({
  itemId,
  viewerReady,
  onTocGenerate,
  onOutlineLoad
}: UseEpubInstanceProps) => {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    if (!itemId || !viewerReady) {
      return;
    }

    const initializeBook = async () => {
      try {
        setLoadingStatus('Fetching EPUB file...');
        const epubUrl = `http://localhost:3000/api/items/${itemId}/resource/epub`;
        const response = await fetch(epubUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        setLoadingStatus('Creating EPUB instance...');
        const newBook = ePub(blob);

        setLoadingStatus('Opening EPUB file...');
        await newBook.ready;
        
        if (!newBook.packaging) {
          throw new Error('Invalid EPUB file: missing package document');
        }

        setBook(newBook);

        // Load TOC
        const navigation = await newBook.loaded.navigation;
        if (navigation && navigation.toc) {
          const tocItems = navigation.toc.map((item: any) => ({
            label: item.label || 'Untitled',
            href: item.href || '#',
            subitems: Array.isArray(item.subitems) 
              ? item.subitems.map((subitem: any) => ({
                  label: subitem.label || 'Untitled',
                  href: subitem.href || '#',
                }))
              : []
          }));
          
          setToc(tocItems);
          onTocGenerate?.(tocItems);
          onOutlineLoad?.(tocItems.length > 0);
        }

      } catch (err) {
        console.error('Error initializing EPUB:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize EPUB');
        setToc([]);
        onTocGenerate?.([]);
        onOutlineLoad?.(false);
      }
    };

    initializeBook();

    return () => {
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn('Error cleaning up book:', e);
        }
      }
    };
  }, [itemId, viewerReady]);

  return {
    book,
    error,
    loadingStatus,
    toc
  };
};
