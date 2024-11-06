import { useState, useCallback } from 'react';
import { itemsService } from './services/items.service';
import PDFViewer from './components/PDFViewer';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedItemId, setUploadedItemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a PDF file');
      setSelectedFile(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      const result = await itemsService.uploadFile(selectedFile);
      if (result.success && result.item) {
        setUploadedItemId(result.item.id);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [selectedFile]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 上傳區域 */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Upload PDF</h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className={`px-4 py-2 rounded-md text-white font-medium
                ${selectedFile 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Upload
            </button>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>
        </div>

        {/* 預覽區域 */}
        {uploadedItemId && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">PDF Preview</h2>
            <div className="h-[600px]">
              <PDFViewer 
                url={`${itemsService.baseUrl}/${uploadedItemId}/resource`} 
                scale={1.0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
