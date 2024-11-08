import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface UploaderProps {
  onUploadSuccess: () => void
}

const Uploader: React.FC<UploaderProps> = ({ onUploadSuccess }) => {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [open, setOpen] = useState(false)
  const [rssUrl, setRssUrl] = useState('')
  const [fetchInterval, setFetchInterval] = useState('60')

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
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      event.target.value = ''
      onUploadSuccess()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file: " + error,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRssSubscribe = async () => {
    if (!rssUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid RSS URL",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const response = await fetch('http://localhost:3000/api/items/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedUrl: rssUrl,
          fetchInterval: parseInt(fetchInterval),
        }),
      })

      if (!response.ok) throw new Error('Failed to add RSS feed')

      toast({
        title: "Success",
        description: "RSS feed added successfully",
      })
      setRssUrl('')
      setFetchInterval('60')
      onUploadSuccess()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add RSS feed: " + error,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className='w-full'>
          <Plus className="h-4 w-4" />
          Uploader
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Content</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="rss">Add RSS Feed</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose File</Label>
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.epub,.txt"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, EPUB, TXT
              </p>
            </div>
          </TabsContent>
          <TabsContent value="rss" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rss-url">RSS Feed URL</Label>
              <Input
                id="rss-url"
                type="url"
                placeholder="https://example.com/feed.xml"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fetch-interval">
                Fetch Interval (minutes)
              </Label>
              <Input
                id="fetch-interval"
                type="number"
                min="1"
                value={fetchInterval}
                onChange={(e) => setFetchInterval(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleRssSubscribe}
              disabled={isUploading}
            >
              {isUploading ? <LoadingSpinner /> : 'Add RSS Feed'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default Uploader
