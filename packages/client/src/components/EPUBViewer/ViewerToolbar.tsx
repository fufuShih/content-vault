import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';

interface ViewerToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  onSidebarToggle: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  isLoading,
  onSidebarToggle,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut
}) => (
  <div className="h-16 border-b flex items-center px-4 bg-background">
    <div className="flex-1 flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={onSidebarToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>

    <div className="flex-1 flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevPage}
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
          onClick={onNextPage}
          disabled={currentPage >= totalPages - 1 || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomOut}
          disabled={scale <= 50 || isLoading}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[60px] text-center">{scale}%</span>
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomIn}
          disabled={scale >= 200 || isLoading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="flex-1" />
  </div>
);
