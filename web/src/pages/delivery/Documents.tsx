import React, { useState } from 'react';
import { FileSearch, Search, FileText, UploadCloud, Folder, Key, ShieldCheck, Tag } from 'lucide-react';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState([
    { id: 'd1', title: 'Mahmoud_National_ID.pdf', size: '1.2 MB', status: 'indexed', date: '2026-06-01', ocr: 'REDP Platform Smart OCR Scanned Document. Valid national ID number: 29509081234567. Expiry date: 2030-05-12. Gender: Male. Address: New Cairo, Egypt. Status: Active.' },
    { id: 'd2', title: 'Reservation_Agreement_Unit_A101.pdf', size: '2.4 MB', status: 'indexed', date: '2026-06-01', ocr: 'REDP Platform Smart OCR Scanned Document. This legal document contains sales agreements, installment terms, delay penalties, unit dimensions, and digital signature logs.' },
    { id: 'd3', title: 'Floor_Overlay_Layout_V501.pdf', size: '4.8 MB', status: 'indexed', date: '2026-05-28', ocr: 'Standard property record sheet. Contains floor overlay metadata, inspection checklists, and snagging items indexes.' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newFile, setNewFile] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setUploading(true);

    setTimeout(() => {
      // Simulate smart OCR text extraction based on title contents
      let extractedOcr = `REDP Platform Smart OCR Scanned Document. Title: ${newTitle}. Scanned & indexed successfully. `;
      
      if (newTitle.toLowerCase().includes('contract') || newTitle.toLowerCase().includes('agreement')) {
        extractedOcr += "This legal document contains sales agreements, installment terms, delay penalties, unit dimensions, and digital signature logs.";
      } else if (newTitle.toLowerCase().includes('id') || newTitle.toLowerCase().includes('national')) {
        extractedOcr += "Identities Card document. Valid national ID number: 29509081234567. Expiry date: 2030-05-12. Address: New Cairo, Egypt.";
      } else {
        extractedOcr += "Standard property record sheet. Contains floor overlay metadata, inspection checklists, and snagging items indexes.";
      }

      const doc = {
        id: 'd' + (documents.length + 1),
        title: newTitle.endsWith('.pdf') ? newTitle : newTitle + '.pdf',
        size: '1.5 MB',
        status: 'indexed',
        date: nowIsoDate(),
        ocr: extractedOcr
      };

      setDocuments([doc, ...documents]);
      setNewTitle('');
      setUploading(false);
    }, 800);
  };

  const nowIsoDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Fuzzy Search filter (Section H.20 search matching)
  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.ocr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple highlighted helper
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
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
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.20 (MAHMOUD)</span>
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
            {filteredDocs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No matches found inside OCR indexed records.</div>
            ) : (
              filteredDocs.map((doc) => (
                <div key={doc.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText style={{ color: 'var(--color-primary)', width: '28px', height: '28px' }} />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{highlightSearch(doc.title, searchQuery)}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {doc.size} | Uploaded: {doc.date}</span>
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
                    {highlightSearch(doc.ocr, searchQuery)}
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
            <p style={{ fontSize: '0.8rem', marginBottom: '24px' }}>Submit contracts or national ID scans. File will be indexed and extracted using mock text tags.</p>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document Title</label>
                <input type="text" className="form-control" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Melwany_Signed_Contract" required />
              </div>

              {/* simulated drop zone */}
              <div style={{ padding: '30px', border: '2px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.02)', textAlign: 'center', cursor: 'pointer' }}>
                <UploadCloud style={{ width: '36px', height: '36px', color: 'var(--text-muted)', marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select local property file to index</h4>
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
