import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        {/* Add more routes here */}
      </Routes>
    </div>
  )
}

export default App
