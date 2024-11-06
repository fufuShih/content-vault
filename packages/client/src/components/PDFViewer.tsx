import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, buildUrl } from '../services/api.config';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// 設置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// PDF URL 生成函數
const generatePdfUrl = (id: number) => {
  const baseUrl = API_BASE_URL.startsWith('http') 
    ? API_BASE_URL 
    : `${window.location.origin}${API_BASE_URL}`;
  return `${baseUrl}/items/${id}/resource`;
};

interface PDFViewerProps {
  fileId: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  // 載入 PDF 文檔
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pdf = await pdfjsLib.getDocument(generatePdfUrl(fileId)).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [fileId]);

  // 渲染當前頁面
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Cannot get canvas context');
        }

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render page');
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-600">{error}</p>
          <a 
            href={generatePdfUrl(fileId)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-block"
          >
            Download PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具列 */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={isLoading}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50"
          >
            -
          </button>
          <button
            onClick={handleResetZoom}
            disabled={isLoading}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50"
          >
            {(scale * 100).toFixed(0)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={isLoading}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF 顯示區域 */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="relative flex justify-center min-h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
              <div className="animate-spin text-2xl text-blue-500">↻</div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

// 上傳组件
const PDFUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const uploadUrl = buildUrl('items/upload');
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
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
      
      if (!result.id) {
        throw new Error('Invalid response: missing file ID');
      }

      setUploadedFileId(result.id);
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error 
          ? `Upload failed: ${err.message}`
          : 'Upload failed. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
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
                <div className="flex justify-center text-4xl text-gray-400">
                  ↑
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
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-blue-500">📄</span>
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
                  aria-label="Remove file"
                >
                  ✕
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

        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="min-w-[100px] px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <span className="inline-block animate-spin">↻</span>
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">PDF Preview</h2>
              <a
                href={generatePdfUrl(uploadedFileId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Open in new tab
              </a>
            </div>
          </div>
          <div className="h-[800px]">
            <PDFViewer fileId={uploadedFileId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
