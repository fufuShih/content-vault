import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import PDFViewer from '@/components/PDFViewer';

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
  const navigate = useNavigate();
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

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{item?.title}</h1>
              <p className="text-sm text-gray-500">{item?.author}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50">
        {item && <PDFViewer itemId={item.id} />}
      </div>
    </div>
  );
};

export default CollectionDetailPage;
