import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import HomePage from './pages/home.page';
import CollectionDetailPage from './pages/collection-detail.page';
import { Input } from './components/ui/input';

function App() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button className="p-2 hover:bg-accent rounded-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="mx-4 text-xl font-semibold">Brand</span>

            <div className="flex-1">
              <Input 
                className="max-w-[400px]" 
                placeholder="Search..."
              />
            </div>
          </div>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/collection/:id" element={<CollectionDetailPage />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </>
  );
}

export default App;
