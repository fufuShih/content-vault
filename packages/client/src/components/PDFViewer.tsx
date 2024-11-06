import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api.config';

const PDFViewer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      // 使用代理的 URL
      console.log('Uploading to:', `${API_BASE_URL}/items/upload`);
      
      const response = await fetch(`${API_BASE_URL}/items/upload`, {
        method: 'POST',
        body: formData,
        // 不需要設置 credentials 和 mode，因為使用代理
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}${
            errorText ? ` - ${errorText}` : ''
          }`
        );
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      setUploadedFileId(result.id);
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid PDF file');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">PDF Upload & Viewer</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload your PDF files and view them directly in the browser
          </p>
        </div>
        
        <div className="px-6 pb-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
          >
            {!file ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  Upload
                </div>
                <div className="text-gray-600">
                  <p className="text-lg font-medium">Drop your PDF file here</p>
                  <p className="text-sm">or</p>
                  <label className="mt-2 inline-block">
                    <span className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  File
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  X
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
              disabled={!uploadedFileId}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom Out
            </button>
            <button
              onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
              disabled={!uploadedFileId}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom In
            </button>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="min-w-[100px] px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              'Loading'
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>

      {/* PDF Preview */}
      {uploadedFileId && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">PDF Preview</h2>
          </div>
          <div className="px-6 pb-6">
            <div className="h-[600px] bg-gray-100 rounded-lg">
              <iframe
                src={`${API_BASE_URL}/items/${uploadedFileId}/resource#view=FitH`}
                className="w-full h-full rounded-lg"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
