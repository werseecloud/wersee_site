import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { ContentProtection } from './ContentProtection';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
try {
  // Use a more reliable CDN path for the worker
  // Using jsdelivr as it often handles .mjs better in some environments
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.error('Failed to set pdfjs worker source:', e);
}

interface PdfViewerProps {
  url: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Prevent right click to disable downloading
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <ContentProtection contentId={url}>
      <div 
        ref={containerRef}
        className={`flex flex-col bg-[#141414] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative ${isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[80vh]'}`}
        onContextMenu={handleContextMenu}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] border-b border-white/5 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-white/10 rounded-xl text-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-300">
              Page {pageNumber} of {numPages || '--'}
            </span>
            <button 
              onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
              disabled={pageNumber >= (numPages || 1)}
              className="p-2 hover:bg-white/10 rounded-xl text-white disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-300 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex justify-center bg-[#0A0A0A] p-8 custom-scrollbar">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
            error={
              <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                Failed to load PDF. Please try again later.
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-2xl"
            />
          </Document>
        </div>
        
        {/* Overlay to prevent dragging/saving images */}
        <div className="absolute inset-0 z-0 pointer-events-none" />
      </div>
    </ContentProtection>
  );
};
