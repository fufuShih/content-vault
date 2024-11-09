export interface EPUBViewerProps {
  itemId: number;
  onTocGenerate?: (toc: TOCItem[]) => void;
  onOutlineLoad?: (hasOutline: boolean) => void;
}

export interface TOCItem {
  label: string;
  href: string;
  subitems?: TOCItem[];
}
