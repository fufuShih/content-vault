import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TOCItem {
  pageIndex: number;
  title: string;
  children?: TOCItem[];
}

interface PDFTocProps {
  outline: TOCItem[];
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
}

const PDFToc: React.FC<PDFTocProps> = ({ outline, currentPage, onPageChange }) => {
  const renderTocItem = (item: TOCItem, level: number = 0) => (
    <div key={`${item.title}-${item.pageIndex}`} className="flex flex-col">
      <button
        onClick={() => onPageChange(item.pageIndex)}
        className={cn(
          "flex items-center text-sm py-1 px-2 hover:bg-accent rounded",
          currentPage === item.pageIndex && "bg-accent",
          level > 0 && "ml-4"
        )}
      >
        <ChevronRight className="h-3 w-3 shrink-0 mr-1" />
        <span className="truncate flex-1 text-left">{item.title}</span>
        <span className="text-xs text-muted-foreground ml-2">{item.pageIndex + 1}</span>
      </button>
      {item.children?.map(child => renderTocItem(child, level + 1))}
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {outline.length > 0 ? (
          outline.map(item => renderTocItem(item))
        ) : (
          <div className="text-sm text-muted-foreground p-2">
            No table of contents available
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default PDFToc;
