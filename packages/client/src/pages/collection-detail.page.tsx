import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import PDFViewer from '@/components/PDFViewer';
import RSSViewer, { RSSEntry } from '@/components/RSSViewer';
import PDFToc, { TOCItem } from '@/components/PDFToc';
import { Menu } from "lucide-react";

interface Item {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  url: string;
  type: string;
}

const CollectionDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const viewType = searchParams.get('type') || 'pdf';
  const [item, setItem] = useState<Item | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pdfOutline, setPdfOutline] = useState<TOCItem[]>([]);
  const [rssEntries, setRssEntries] = useState<RSSEntry[]>([]);
  const [hasOutline, setHasOutline] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<RSSEntry | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/items/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
      }
    };

    if (id) fetchItem();
  }, [id]);

  useEffect(() => {
    if (viewType === 'rss' && id) {
      const fetchRssEntries = async () => {
        try {
          const response = await fetch(`http://localhost:3000/api/items/feeds/${id}/entries`);
          if (!response.ok) throw new Error('Failed to fetch RSS entries');
          const data = await response.json();
          setRssEntries(data);
        } catch (error) {
          console.error('Error fetching RSS entries:', error);
        }
      };
      fetchRssEntries();
    }
  }, [id, viewType]);

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const handleEntrySelect = (entry: RSSEntry) => {
    setSelectedEntry(entry);
  };

  const renderSidebar = () => {
    if (sidebarCollapsed) return null;

    if (viewType === 'pdf' && hasOutline) {
      return (
        <PDFToc 
          outline={pdfOutline} 
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      );
    }

    if (viewType === 'rss') {
      return (
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {rssEntries.map(entry => (
              <button
                key={entry.id}
                className={`w-full text-left px-3 py-2 rounded hover:bg-accent text-sm ${
                  selectedEntry?.id === entry.id ? 'bg-accent' : ''
                }`}
                onClick={() => handleEntrySelect(entry)}
              >
                <div className="font-medium line-clamp-2">{entry.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(entry.pubDate).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      );
    }

    return null;
  };

  const renderViewer = () => {
    if (!item) return null;

    switch (viewType) {
      case 'pdf':
        return (
          <PDFViewer 
            itemId={item.id}
            onOutlineLoad={setHasOutline}
            onTocGenerate={setPdfOutline}
          />
        );
      case 'rss':
        return (
          <RSSViewer 
            itemId={item.id}
            selectedEntry={selectedEntry}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unsupported content type: {viewType}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-16 border-b flex items-center px-4 gap-4 bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div 
          className={`border-r bg-background transition-all ${
            sidebarCollapsed ? 'w-0' : 'w-64'
          }`}
        >
          {renderSidebar()}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {viewType === 'pdf' && (
            <div className="h-12 border-b flex items-center px-4 gap-2">
              <Button variant="outline" size="sm">Zoom In</Button>
              <Button variant="outline" size="sm">Zoom Out</Button>
              <span className="text-sm ml-4">Page {currentPage}</span>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden bg-gray-50">
            {renderViewer()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;
