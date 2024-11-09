import React from 'react';
import { TOCItem } from './types';

interface EPUBTocProps {
  toc: TOCItem[];
  onNavigate: (href: string) => void;
}

const EPUBToc: React.FC<EPUBTocProps> = ({ toc, onNavigate }) => {
  const renderTocItem = (item: TOCItem) => (
    <div key={item.href} className="flex flex-col">
      <button
        className="text-left px-4 py-2 hover:bg-accent text-sm"
        onClick={() => onNavigate(item.href)}
      >
        {item.label}
      </button>
      {item.subitems && (
        <div className="ml-4">
          {item.subitems.map(subitem => renderTocItem(subitem))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-2">
      <div className="font-semibold px-4 py-2">Table of Contents</div>
      {toc.map(item => renderTocItem(item))}
    </div>
  );
};

export default EPUBToc;
