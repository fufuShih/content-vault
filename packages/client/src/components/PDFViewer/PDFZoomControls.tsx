import React from 'react';
import { Button } from "@/components/ui/button";
import { Minus, Plus } from 'lucide-react';

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
