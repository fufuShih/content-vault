import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, Volume2, VolumeX } from 'lucide-react';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface PDFZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const PDFZoomControls: React.FC<PDFZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div id="zoom-controls" className="flex items-center gap-2">
      <Button
        id="zoom-out"
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        disabled={scale <= 0.5}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span id="zoom-level">{Math.round(scale * 100)}%</span>
      <Button
        id="zoom-in"
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        disabled={scale >= 3}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

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

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  inputPage: string;
  onSidebarToggle: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onInputPageChange: (value: string) => void;
  isPlaying: boolean;
  onTtsToggle: () => void;
}

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  inputPage,
  onSidebarToggle,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onInputPageChange,
  isPlaying,
  onTtsToggle,
}) => {
  return (
    <div className="h-16 border-b flex items-center px-4 bg-background">
      <div className="flex-1 flex items-center">
        <Button
          id="sidebar-toggle"
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center gap-4">
        <PDFPageControls
          currentPage={currentPage}
          totalPages={totalPages}
          inputPage={inputPage}
          onPageChange={onPageChange}
          onInputPageChange={onInputPageChange}
        />
        <PDFZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
      </div>

      <div className="flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTtsToggle}
          aria-label={isPlaying ? 'Stop reading' : 'Start reading'}
        >
          {isPlaying ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
