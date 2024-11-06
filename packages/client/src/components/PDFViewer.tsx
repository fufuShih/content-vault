import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { API_BASE_URL, buildUrl } from '../services/api.config';

// 設置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

const PDFViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // PDF URL 生成函數
  const getPdfUrl = (id: number) => {
    const baseUrl = API_BASE_URL.startsWith('http') 
      ? API_BASE_URL 
      : window.location.origin + API_BASE_URL;
    return `${baseUrl}/items/${id}/resource`;
  };

  // 處理檔案選擇
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      
      // 自動上傳
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        setIsLoading(true);
        const response = await fetch(buildUrl('items/upload'), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        setUploadedFileId(result.id);
      } catch (error) {
        console.error('Upload error:', error);
        setError('Upload failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // 載入 PDF
  useEffect(() => {
    if (!uploadedFileId) return;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const pdf = await pdfjsLib.getDocument(getPdfUrl(uploadedFileId)).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [uploadedFileId]);

  // 渲染 PDF 頁面
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        const viewport = page.getViewport({ scale: 1.5 });
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
  }, [pdfDoc, currentPage]);

  // 頁面控制
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 上傳區域 */}
      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-500 file:text-white
            hover:file:bg-blue-600"
        />
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* PDF 顯示區域 */}
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin text-blue-500">↻</div>
        </div>
      ) : pdfDoc ? (
        <div className="border rounded-lg bg-gray-50 p-4">
          {/* 導航控制項 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <a
              href={getPdfUrl(uploadedFileId!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              Open in new tab
            </a>
          </div>

          {/* Canvas 顯示區域 */}
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="shadow-lg" />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PDFViewer;
