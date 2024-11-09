import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export interface RSSEntry {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  content: string | null;
  link: string;
  pubDate: string;
}

interface RSSViewerProps {
  itemId: number;
}

const RSSViewer: React.FC<RSSViewerProps> = ({ itemId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rssEntries, setRssEntries] = useState<RSSEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<RSSEntry | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchRssEntries = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/items/feeds/${itemId}/entries`);
        if (!response.ok) throw new Error('Failed to fetch RSS entries');
        const data = await response.json();
        setRssEntries(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching RSS entries:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
      }
    };
    fetchRssEntries();
  }, [itemId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoading && !selectedEntry) {
    return (
      <div className="h-full flex justify-center items-center">
        <Skeleton className="h-[600px] w-[800px]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
          {!sidebarCollapsed && (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {rssEntries.map(entry => (
                  <button
                    key={entry.id}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-accent text-sm ${
                      selectedEntry?.id === entry.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="font-medium line-clamp-2">{entry.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(entry.pubDate).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-full">
            {selectedEntry ? (
              <div className="h-full overflow-auto p-6">
                <article className="max-w-4xl mx-auto">
                  <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-4">{selectedEntry.title}</h1>
                    <div className="flex items-center gap-4 text-gray-500">
                      <span>By {selectedEntry.author || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(selectedEntry.pubDate), { addSuffix: true })}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedEntry.link, '_blank')}
                      >
                        Open Original
                      </Button>
                    </div>
                  </header>
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedEntry.content || selectedEntry.description || '' 
                    }}
                  />
                </article>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select an article to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSSViewer;
