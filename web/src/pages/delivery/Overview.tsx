import React from 'react';
import { Building2, Wrench, ShieldCheck, FileSearch, Terminal, Play } from 'lucide-react';

const Overview: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🟢 Delivery & Compound Operations</h1>
          <p>Compound portal, snagging inspection app, contractor SLA monitor, and smart DMS.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.2 / H.8 / H.17 (MAHMOUD)</span>
        </div>
      </div>

      {/* Developer Instruction Alert */}
      <div className="glass-panel" style={{ padding: '30px', borderLeft: '5px solid var(--color-success)', background: 'rgba(16,185,129,0.03)' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Terminal style={{ width: '20px', height: '20px' }} />
          مرحباً مهندس محمود! الهيكل الأساسي مهيأ وجاهز لتبدأ عملك
        </h3>
        <p style={{ color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.6' }}>
          بناءً على طلبك، قمنا بإنشاء وتأمين **هيكل المشروع الأساسي بالكامل (Base Sandbox Skeleton)** دون كتابة أو تداخل مع أي منطق برمجي خاص بمهامك. جميع النماذج (Models)، جداول البيانات (Migrations) المتوافقة مع MySQL، المسارات (API Routes)، وبوابات العبور الأمنية (RBAC) تم إعدادها بالكامل في الخلفية. 
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          شاشات الملاك وصيانة المقاولين، وتطبيق الفحص للاستلام (Snagging App)، والأرشفة الذكية (OCR DMS) متاحة لك هنا كـ Stubs نظيفة تماماً لتبدأ البناء عليها براحة كاملة.
        </p>
      </div>

      {/* Grid of Mahmoud's Tasks/Placeholders */}
      <div className="grid-cards">
        
        {/* H.2 / H.8 compound stub */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 style={{ color: 'var(--color-success)', width: '24px', height: '24px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>H.2 & H.8 Compound Portal</h3>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Owner dashboards, gate QR codes, and facilities reservation screens go here.</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'rgba(16,185,129,0.08)', padding: '8px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>
            STATUS: Ready for Mahmoud
          </div>
        </div>

        {/* H.17 snagging app stub */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck style={{ color: 'var(--color-success)', width: '24px', height: '24px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>H.17 Snagging App</h3>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Inspection checklist checklist items, defect logging camera feeds, and QC digital signs.</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'rgba(16,185,129,0.08)', padding: '8px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>
            STATUS: Ready for Mahmoud
          </div>
        </div>

        {/* H.20 document vault stub */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSearch style={{ color: 'var(--color-success)', width: '24px', height: '24px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>H.20 Smart OCR Vault</h3>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Smart document vaults, full-text searchable scans, and ID renewal reminders.</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'rgba(16,185,129,0.08)', padding: '8px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>
            STATUS: Ready for Mahmoud
          </div>
        </div>

      </div>

    </div>
  );
};

export default Overview;
