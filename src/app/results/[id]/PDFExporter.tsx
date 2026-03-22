'use client';

import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface PDFExporterProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
  productName: string;
  setIsExporting: (val: boolean) => void;
}

export default function PDFExporter({ reportRef, productName, setIsExporting }: PDFExporterProps) {
  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    setIsExporting(true);
    try {
      // Dynamic imports inside the function
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Temporary show PDF header and ensure it's captured
      const header = document.getElementById('pdf-header');
      if (header) {
        header.style.display = 'flex';
        header.style.visibility = 'visible';
      }

      // Wait for React to re-render and any animations/layouts to settle
      await new Promise(r => setTimeout(r, 800));

      const dataUrl = await toJpeg(reportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        style: {
          transform: 'none',
          transition: 'none',
          opacity: '1',
          visibility: 'visible'
        }
      });

      // Restore header visibility
      if (header) {
        header.style.display = 'none';
        header.style.visibility = 'hidden';
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate height maintaining aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      // Use JPEG with compression
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Footer/Watermark
      pdf.setFontSize(8);
      pdf.setTextColor(180);
      pdf.text('Made By ExportReady AI - Laporan Kesiapan Ekspor UMKM Indonesia', pdfWidth / 2, 290, { align: 'center' });
      
      pdf.save(`ExportReady_${productName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      // Ensure header is hidden even on error
      const header = document.getElementById('pdf-header');
      if (header) {
        header.style.display = 'none';
        header.style.visibility = 'hidden';
      }
    } finally {
      setDownloading(false);
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="h-14 px-8 rounded-2xl font-black border-2 hover:bg-slate-50 gap-2 shadow-xl shadow-slate-200/50 group"
      onClick={downloadReport}
      disabled={downloading}
    >
      {downloading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />}
      {downloading ? 'Menyiapkan PDF...' : 'Download PDF'}
    </Button>
  );
}
