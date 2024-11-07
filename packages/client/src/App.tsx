import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import HomePage from './pages/home.page';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
