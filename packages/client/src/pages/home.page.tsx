import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast'
import Sidebar from '@/components/Sidebar'
import CollectItem, { Item } from '@/components/CollectItem'
import LoadingSpinner from '@/components/LoadingSpinner'

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
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
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
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      const response = await fetch('http://localhost:3000/api/items/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      await fetchItems()
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      event.target.value = ''
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
  }

  const handleReadClick = (itemId: number) => {
    setSelectedItem(null)
    navigate(`/collection/${itemId}`)
  }

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
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf,.epub,.txt"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
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
            <DialogTitle>Book Detail</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-md" />
            <div>
              <h2 className="text-xl font-semibold mb-2">{selectedItem?.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                By {selectedItem?.author || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                {selectedItem?.description || 'No description available'}
              </p>
            </div>
          </div>
          <DialogFooter>
            {selectedItem && (
              <Button onClick={() => handleReadClick(selectedItem.id)}>
                Read
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HomePage
