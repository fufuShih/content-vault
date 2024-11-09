import React, { useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

interface RSSEntry {
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
  selectedEntry?: RSSEntry | null;
}

const RSSViewer: React.FC<RSSViewerProps> = ({ itemId, selectedEntry }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  );
};

export default RSSViewer;
