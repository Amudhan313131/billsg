'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

type UploadState = 'initial' | 'loading' | 'success' | 'error';

interface ParsedBillResult {
  hospital_name: string;
  ward_class: string;
  warnings: string[];
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPage() {
  const [state, setState] = useState<UploadState>('initial');
  const [errorMessage, setErrorMessage] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsedResult, setParsedResult] = useState<ParsedBillResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or PDF file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Please upload a file under 10MB.';
    }
    return null;
  };

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setState('error');
      return;
    }

    setState('loading');
    setErrorMessage('');
    setWarnings([]);
    setParsedResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed. Please try again.');
      }

      const { s3Key } = await uploadRes.json();

      const parseRes = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key }),
        signal: controller.signal,
      });

      if (!parseRes.ok) {
        const data = await parseRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not read bill. Please ensure the bill is flat and well-lit.');
      }

      const result = await parseRes.json();

      sessionStorage.setItem('parsedBill', JSON.stringify(result.bill));

      const billWarnings: string[] = result.warnings || [];
      setWarnings(billWarnings);
      setParsedResult({
        hospital_name: result.bill.hospital_name || 'Unknown Hospital',
        ward_class: result.bill.ward_class || 'unknown',
        warnings: billWarnings,
      });
      setState('success');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('initial');
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Could not read bill. Please ensure the bill is flat and well-lit.';
      setErrorMessage(message);
      setState('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState('initial');
    setErrorMessage('');
    setWarnings([]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatWardClass = (wardClass: string) => {
    if (wardClass === 'unknown') return 'Not detected';
    return `Class ${wardClass}`;
  };

  const steps = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Upload', href: '/upload' },
    { label: 'Explain', href: '/explain' },
    { label: 'Match', href: '/match' },
  ];
  const currentStep = 1;

  return (
    <div className={inter.className} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #F0FDFA 0%, #FFFFFF 60%, #F0FDFA 100%)' }}>
      {/* Navigation */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #99F6E4', padding: '16px 24px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D9488', textDecoration: 'none' }}>
            BillSG
          </Link>
        </div>
      </nav>

      {/* Stepper */}
      <div style={{ maxWidth: '768px', width: '100%', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          {/* Connecting lines — completed segments solid teal, future segments light grey */}
          <div style={{ position: 'absolute', top: '16px', left: '32px', right: '32px', height: '2px', background: '#E5E7EB', zIndex: 0 }} aria-hidden="true" />
          <div style={{ position: 'absolute', top: '16px', left: '32px', width: 'calc((100% - 64px) * 0.333)', height: '2px', background: '#0D9488', zIndex: 0 }} aria-hidden="true" />
          {steps.map((step, idx) => (
            <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: idx === currentStep ? 700 : 500,
                color: idx <= currentStep ? '#FFFFFF' : '#4B5563',
                background: idx <= currentStep ? '#0D9488' : '#E7E5E4',
              }}>
                {idx + 1}
              </div>
              <span style={{
                marginTop: '8px',
                fontSize: '0.875rem',
                fontWeight: idx === currentStep ? 700 : 400,
                color: idx === currentStep ? '#1C1917' : '#4B5563',
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '768px', width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        {/* Page Title */}
        <h1 style={{ fontWeight: 800, color: '#1C1917', fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '8px' }}>
          Upload Your Bill
        </h1>
        <p style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '40px' }}>
          Upload a photo or PDF of your hospital bill and we'll help you understand it.
        </p>

        {/* Drag Hint Animation */}
        {(state === 'initial' || state === 'error') && (
          <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }} aria-hidden="true">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
              {/* Sliding document */}
              <div className="slide-doc">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="4" width="24" height="32" rx="3" stroke="#0D9488" strokeWidth="2" fill="#F0FDFA" />
                  <path d="M14 16 L26 16" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 21 L24 21" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 26 L20 26" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              {/* Target drop zone */}
              <div style={{ width: '60px', height: '70px', border: '2px dashed #0D9488', borderRadius: '8px', opacity: 0.5 }} />
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#6B7280', textAlign: 'center' }}>
              Drag your bill into the box above
            </p>
          </div>
        )}

        {/* Error Banner */}
        {state === 'error' && errorMessage && (
          <div
            style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: '0.75rem', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
            role="alert"
          >
            <span style={{ fontSize: '1.25rem', marginTop: '2px' }} aria-hidden="true">⚠️</span>
            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#DC2626', margin: 0 }}>{errorMessage}</p>
          </div>
        )}

        {/* Warning Banners */}
        {state === 'success' && warnings.length > 0 && (
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                style={{ background: '#FFFBEB', borderLeft: '4px solid #D97706', borderRadius: '0.75rem', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                role="status"
              >
                <span style={{ fontSize: '1.25rem', marginTop: '2px' }} aria-hidden="true">⚡</span>
                <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#D97706', margin: 0 }}>{warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Success Card */}
        {state === 'success' && parsedResult && (
          <div style={{ background: '#F0FDF4', borderLeft: '4px solid #16A34A', borderRadius: '1rem', boxShadow: '0 4px 16px rgba(22,163,74,0.1)', padding: '32px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }} aria-hidden="true">✓</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16A34A', margin: 0 }}>Bill uploaded successfully</h2>
            </div>
            <div style={{ fontSize: '1.125rem', color: '#1C1917', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Hospital:</span> {parsedResult.hospital_name}</p>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Ward:</span> {formatWardClass(parsedResult.ward_class)}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', boxShadow: '0 8px 40px rgba(13,148,136,0.10)', padding: '48px 32px', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ maxWidth: '320px', margin: '0 auto 24px', height: '8px', borderRadius: '9999px', background: '#99F6E4', overflow: 'hidden' }}>
              <div className="loading-bar" style={{ height: '100%', borderRadius: '9999px', background: '#0D9488' }} />
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1C1917', marginBottom: '24px' }}>Uploading and reading your bill…</p>
            <button
              onClick={handleCancel}
              style={{ border: '2px solid #E7E5E4', background: 'transparent', color: '#78716C', borderRadius: '9999px', padding: '14px 40px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Upload Zone */}
        {(state === 'initial' || state === 'error') && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={isDragOver ? 'upload-zone-active' : 'upload-zone-idle'}
            style={{
              background: isDragOver ? '#F0FDFA' : '#FFFFFF',
              borderRadius: '1.5rem',
              border: isDragOver ? '2px dashed #0D9488' : '2px dashed #5EEAD4',
              boxShadow: isDragOver ? '0 8px 40px rgba(13,148,136,0.25)' : '0 8px 40px rgba(13,148,136,0.10)',
              minHeight: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 32px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload your hospital bill. Drag and drop or click to browse files."
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {/* Animated Document Icon SVG */}
            <div className={isDragOver ? 'upload-icon-fast' : 'upload-icon'} aria-hidden="true" style={{ marginBottom: '4px' }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="18" y="10" width="44" height="56" rx="6" stroke="#0D9488" strokeWidth="3" fill="#F0FDFA" />
                <path d="M30 38 L50 38" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 46 L46 46" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 54 L42 54" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" />
                <path d="M40 30 L40 16" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" />
                <path d="M34 22 L40 16 L46 22" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Pulsing Downward Arrow */}
            <div className={isDragOver ? 'upload-arrow-fast' : 'upload-arrow'} aria-hidden="true" style={{ marginBottom: '20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 4 L12 18 M6 13 L12 19 L18 13" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1C1917', marginBottom: '8px' }}>
              Drag and drop your bill here
            </p>
            <p style={{ fontSize: '1.125rem', color: '#78716C', marginBottom: '28px' }}>
              JPG, PNG or PDF • Max 10MB
            </p>
            <button
              type="button"
              className="browse-btn"
              style={{
                background: '#0D9488',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '14px 44px',
                fontSize: '1.1rem',
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0F766E'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(13,148,136,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0D9488'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.35)'; }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link
            href="/dashboard"
            style={{ color: '#0D9488', fontSize: '1.125rem', fontWeight: 500, textDecoration: 'none', minHeight: '48px', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            ← Back to Dashboard
          </Link>

          {state === 'success' ? (
            <Link
              href="/explain"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '16px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(13,148,136,0.4)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              Explain My Bill →
            </Link>
          ) : (
            <button
              disabled
              style={{
                border: '2px solid #E7E5E4',
                color: '#A8A29E',
                background: 'transparent',
                borderRadius: '9999px',
                padding: '16px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'not-allowed',
                minHeight: '48px',
              }}
              aria-disabled="true"
            >
              Explain My Bill →
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#F0FDFA', borderTop: '1px solid #99F6E4', padding: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#78716C' }}>
        BillSG is a guidance tool only. Always consult a Medical Social Worker before taking action.
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes bob-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes pulse-down {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(5px); }
        }
        @keyframes pulse-down-fast {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(7px); }
        }
        @keyframes loading {
          0% { width: 15%; }
          50% { width: 85%; }
          100% { width: 15%; }
        }
        @keyframes slide-to-zone {
          0% { transform: translateX(0); opacity: 1; }
          60% { transform: translateX(80px); opacity: 1; }
          80% { transform: translateX(80px); opacity: 0; }
          100% { transform: translateX(0); opacity: 0; }
        }
        .upload-icon {
          animation: bob 2.5s ease-in-out infinite;
        }
        .upload-icon-fast {
          animation: bob-fast 1.2s ease-in-out infinite;
        }
        .upload-arrow {
          animation: pulse-down 1.5s ease-in-out infinite;
        }
        .upload-arrow-fast {
          animation: pulse-down-fast 0.8s ease-in-out infinite;
        }
        .loading-bar {
          animation: loading 1.5s ease-in-out infinite;
        }
        .slide-doc {
          animation: slide-to-zone 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
