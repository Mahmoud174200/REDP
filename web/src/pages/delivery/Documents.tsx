import React, { useState, useEffect } from 'react';
import { FileSearch, Search, FileText, UploadCloud, Folder, ShieldCheck, Tag } from 'lucide-react';
import api from '../../services/api';

interface DocumentData {
  id: string;
  title: string;
  file_path: string;
  ocr_content: string;
  status: string;
  created_at: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async (search = '') => {
    setIsLoading(true);
    try {
      const response = await api.get('/v1/delivery/documents', {
        params: { search }
      });
      if (response.data && response.data.success) {
        setDocuments(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents from DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(searchQuery);
  }, [searchQuery]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedFile) {
      alert('Please provide a document title and select a file.');
      return;
    }
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('file', selectedFile);

      const response = await api.post('/v1/delivery/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        setNewTitle('');
        setSelectedFile(null);
        alert('Document uploaded and OCR indexed successfully!');
        await fetchDocuments(searchQuery);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const highlightSearch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} style={{ background: 'var(--color-warning)', color: '#000000', borderRadius: '2px', padding: '0 2px' }}>{part}</mark> 
            : part
        )}
      </span>
    );
  };

  if (isLoading && documents.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-success)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-success)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
      )}

      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSearch style={{ color: 'var(--color-success)', width: '32px', height: '32px' }} />
            Smart Document Management Vault & OCR Indexer
          </h1>
          <p>Optical Character Recognition full-text vaults, automatic file categories tags, and search indexers.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.20</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* DMS Vault Explorer */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Custom Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '16px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '48px' }} 
              placeholder="Search inside OCR scanned files text (e.g. 'National ID', 'A101', 'plumbing')..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Folder style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Vault Explorer / root / contracts_and_IDs</span>
          </div>

          {/* Documents Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {documents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No matches found inside OCR indexed records.</div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText style={{ color: 'var(--color-primary)', width: '28px', height: '28px' }} />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{highlightSearch(doc.title, searchQuery)}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded: {doc.created_at ? doc.created_at.substring(0,10) : 'N/A'}</span>
                      </div>
                    </div>
                    <span className="badge badge-success">OCR Scanned</span>
                  </div>
                  
                  {/* OCR Block displaying highlighted keywords */}
                  <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: '1.4' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Tag style={{ width: '10px', height: '10px' }} />
                      OCR Text Index Output
                    </span>
                    {highlightSearch(doc.ocr_content, searchQuery)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DMS Upload & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Upload card */}
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <UploadCloud style={{ color: 'var(--color-primary)' }} />
              Upload & OCR Index Document
            </h2>
            <p style={{ fontSize: '0.8rem', marginBottom: '24px' }}>Submit contracts or national ID scans. File will be indexed and extracted automatically on upload.</p>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document Title</label>
                <input type="text" className="form-control" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Signed_Contract" required />
              </div>

              {/* file input */}
              <div style={{ position: 'relative', padding: '20px', border: '2px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.02)', textAlign: 'center' }}>
                <input 
                  type="file" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  required
                />
                <UploadCloud style={{ width: '36px', height: '36px', color: 'var(--text-muted)', marginBottom: '8px', margin: '0 auto' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>
                  {selectedFile ? selectedFile.name : 'Select local property file to index'}
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={uploading}>
                {uploading ? 'Extracting OCR Text...' : 'Index Document to Vault'}
              </button>
            </form>
          </div>

          {/* System indices tags info */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: 'var(--color-success)', width: '18px', height: '18px' }} />
              Indexed Documents Metadata
            </h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '12px' }}>DMS scans database schemas tags dynamically for identity verification audits.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>#NationalID</span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>#Contracts</span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>#UnitLayouts</span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>#HandoverSignatures</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Documents;
