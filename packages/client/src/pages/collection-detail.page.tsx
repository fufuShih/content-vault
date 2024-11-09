import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PDFViewer from '@/components/PDFViewer';
import RSSViewer from '@/components/RSSViewer';

interface Item {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  url: string;
  type: string;
}

const CollectionDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const viewType = searchParams.get('type') || 'pdf';
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/items/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
      }
    };

    if (id) fetchItem();
  }, [id]);

  const renderViewer = () => {
    if (!item) return null;

    switch (viewType) {
      case 'pdf':
        return <PDFViewer itemId={item.id} />;
      case 'rss':
        return <RSSViewer itemId={item.id} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unsupported content type: {viewType}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden bg-gray-50">
        {renderViewer()}
      </div>
    </div>
  );
};

export default CollectionDetailPage;
