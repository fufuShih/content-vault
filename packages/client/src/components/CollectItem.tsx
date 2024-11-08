
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

export interface Item {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectItemProps {
  item: Item;
  onClick?: (item: Item) => void;
}

const CollectItem: React.FC<CollectItemProps> = ({
  item,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(item);
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="aspect-[3/4] bg-gray-100 mb-2 rounded-md"></div>
        <h2 className="text-sm font-medium line-clamp-2">{item.title}</h2>
        <p className="text-xs text-gray-500 mt-1">{item.author || 'Unknown'}</p>
        <Badge>{item.type}</Badge>
      </CardContent>
    </Card>
  )
}

export default CollectItem
