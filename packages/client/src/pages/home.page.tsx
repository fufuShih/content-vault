import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast'
import Sidebar from '@/components/Sidebar'
import CollectItem, { Item } from '@/components/CollectItem'
import Uploader from '@/components/Uploader'

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ApiResponse {
  data: Item[]
  pagination: PaginationInfo
}

const HomePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [items, setItems] = useState<Item[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/items')
      if (!response.ok) throw new Error('Failed to fetch items')
      const result: ApiResponse = await response.json()
      setItems(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Fetch error:', error)
      setItems([])
      toast({
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
  }

  const handleReadClick = (item: Item) => {
    setSelectedItem(null);
    const type = item.type.toLowerCase();
    navigate(`/collection/${item.id}?type=${type}`);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Collection</h1>
              {pagination && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing {items.length} of {pagination.total} items
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Uploader onUploadSuccess={fetchItems} />
            </div>
          </header>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No items found. Upload some files to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <CollectItem
                  key={item.id}
                  item={item}
                  onClick={handleSelectItem}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog 
        open={!!selectedItem} 
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'rss' ? 'Feed Details' : 'Book Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-md" />
            <div>
              <h2 className="text-xl font-semibold mb-2">{selectedItem?.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {selectedItem?.type === 'rss' ? (
                  <span>RSS Feed</span>
                ) : (
                  <span>By {selectedItem?.author || 'Unknown'}</span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                {selectedItem?.description || 'No description available'}
              </p>
            </div>
          </div>
          <DialogFooter>
            {selectedItem && (
              <Button onClick={() => handleReadClick(selectedItem)}>
                {selectedItem.type === 'rss' ? 'View Feed' : 'Read Book'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage
