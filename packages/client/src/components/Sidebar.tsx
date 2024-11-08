import { Button } from "@/components/ui/button";
import Uploader from '@/components/Uploader';
import { ListTodo, Bookmark, Clock } from "lucide-react";

interface SidebarProps {
  onUploadSuccess?: () => void;
}

const Sidebar = ({ onUploadSuccess }: SidebarProps) => {
  const handleUploadSuccess = () => {
    onUploadSuccess?.();
  }
  return (
    <div className="w-64 h-[calc(100vh-64px)] border-r bg-background flex flex-col">
      {/* Upload Button */}
      <div className="p-4">
        <Uploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Navigation */}
      <div className="px-4">
        <h2 className="font-semibold mb-4">Library</h2>
        <nav className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <ListTodo className="mr-2 h-4 w-4" />
            All Books
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Bookmarks
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            Recent
          </Button>
        </nav>
      </div>

      {/* Collections Group */}
      <div className="px-4 mt-8">
        <h2 className="font-semibold mb-4">Collections</h2>
        <nav className="space-y-2">
          {/* Add collection items here */}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
