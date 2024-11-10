import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFPageControlsProps {
  currentPage: number;
  totalPages: number;
  inputPage: string;
  onPageChange: (page: number) => void;
  onInputPageChange: (value: string) => void;
}

export const PDFPageControls: React.FC<PDFPageControlsProps> = ({
  currentPage,
  totalPages,
  inputPage,
  onPageChange,
  onInputPageChange,
}) => {
  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      } else {
        onInputPageChange(currentPage.toString());
      }
    }
  };

  return (
    <div id="page-controls" className="flex items-center gap-2">
      <Button
        id="prev-page"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        <Input
          id="page-input"
          type="text"
          value={inputPage}
          onChange={(e) => onInputPageChange(e.target.value)}
          onKeyDown={handlePageInputKeyDown}
          className="w-16 text-center"
        />
        <span>/ {totalPages}</span>
      </div>

      <Button
        id="next-page"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
