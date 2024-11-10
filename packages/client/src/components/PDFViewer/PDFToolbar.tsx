import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { PDFPageControls } from './PDFPageControls';
import { PDFZoomControls } from './PDFZoomControls';

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  inputPage: string;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onInputPageChange: (value: string) => void;
}

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  inputPage,
  sidebarCollapsed,
  onSidebarToggle,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onInputPageChange,
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

      <div className="flex-1" />
    </div>
  );
};
