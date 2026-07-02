import React, { useState } from 'react';
import api from '../../../services/api';
import {
  FileText, Calendar, Printer, Download, Award, AlertTriangle, ShieldCheck, RefreshCw
} from 'lucide-react';

interface ReportAccount {
  id: string; code: string; name: string; type: string; debit: number; credit: number; balance: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const FinancialReports: React.FC = () => {
  const [reportType, setReportType] = useState<'trial-balance' | 'balance-sheet' | 'income-statement'>('trial-balance');
  const [dateStart, setDateStart] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1st
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]); // today
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/enterprise/accounting/reports?type=${reportType}&date_start=${dateStart}&date_end=${dateEnd}`);
      setReportData(res.data?.data || null);
    } catch (err) {
      console.error('Error generating statement:', err);
      alert('Error generating report. Please check date parameters.');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div className="printable-report">
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} color="var(--color-primary)" />
            📊 General Ledger Financial Statements
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Generate real-time GAAP compliant Trial Balance, Profit & Loss Statements, and Balance Sheet ledger reports
          </p>
        </div>
        
        {reportData && (
          <div style={{ display: 'flex', gap: 8 }} className="no-print">
            <button className="btn-secondary" onClick={handlePrint} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={14} /> Print Report
            </button>
          </div>
        )}
      </div>

      {/* Control Panel Filter */}
      <div className="glass-panel no-print" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Statement Type</label>
          <select style={inputStyle} value={reportType} onChange={e => { setReportType(e.target.value as any); setReportData(null); }}>
            <option value="trial-balance">Trial Balance Sheet</option>
            <option value="balance-sheet">Balance Sheet (Statement of Financial Position)</option>
            <option value="income-statement">Income Statement (Profit & Loss / P&L)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Start Date</label>
          <input type="date" style={inputStyle} value={dateStart} onChange={e => setDateStart(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>End Date</label>
          <input type="date" style={inputStyle} value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={loadReport} style={{ fontSize: '0.75rem', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Generate Report
        </button>
      </div>

      {loading && <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Compiling general ledger transactions...</div>}

      {/* Report Output */}
      {!loading && reportData && (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          {/* Header metadata on printed pages */}
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid var(--border-glass)', paddingBottom: 14 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
              {reportType === 'trial-balance' && 'TRIAL BALANCE'}
              {reportType === 'balance-sheet' && 'BALANCE SHEET'}
              {reportType === 'income-statement' && 'INCOME STATEMENT (P&L)'}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Period: {new Date(dateStart).toLocaleDateString()} to {new Date(dateEnd).toLocaleDateString()}
            </div>
          </div>

          {/* Trial Balance rendering */}
          {reportType === 'trial-balance' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Account Code</th>
                    <th style={headerStyle}>Account Name</th>
                    <th style={headerStyle}>Class Type</th>
                    <th style={{ textAlign: 'right', ...headerStyle }}>Debit (EGP)</th>
                    <th style={{ textAlign: 'right', ...headerStyle }}>Credit (EGP)</th>
                    <th style={{ textAlign: 'right', ...headerStyle }}>Net Balance (EGP)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.accounts.map((acc: ReportAccount) => (
                    <tr key={acc.id}>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', fontWeight: 800 }}>{acc.code}</td>
                      <td style={cellStyle}><strong>{acc.name}</strong></td>
                      <td style={{ ...cellStyle, textTransform: 'capitalize', color: 'var(--text-muted)' }}>{acc.type}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{acc.debit > 0 ? acc.debit.toLocaleString() : '—'}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{acc.credit > 0 ? acc.credit.toLocaleString() : '—'}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{acc.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 800 }}>
                    <td colSpan={3} style={{ padding: 12, textAlign: 'right' }}>Grand Totals:</td>
                    <td style={{ padding: 12, textAlign: 'right', color: 'var(--color-primary)' }}>{reportData.total_debit.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: 'var(--color-primary)' }}>{reportData.total_credit.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: 'var(--color-primary)' }}>
                      {Math.abs(reportData.total_debit - reportData.total_credit) < 0.05 ? 'Balanced' : 'Out of Balance'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Income Statement rendering */}
          {reportType === 'income-statement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Revenues Section */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', borderBottom: '1px solid var(--border-glass)', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>Operating Revenues</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {reportData.revenues.map((acc: ReportAccount) => (
                      <tr key={acc.id}>
                        <td style={{ ...cellStyle, width: '70%' }}>{acc.code} - {acc.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800 }}>
                      <td style={cellStyle}>Total Operating Revenues</td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: '#10b981' }}>{reportData.total_revenue.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses Section */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', borderBottom: '1px solid var(--border-glass)', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>Operating Expenses</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {reportData.expenses.map((acc: ReportAccount) => (
                      <tr key={acc.id}>
                        <td style={{ ...cellStyle, width: '70%' }}>{acc.code} - {acc.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800 }}>
                      <td style={cellStyle}>Total Operating Expenses</td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: '#ef4444' }}>{reportData.total_expense.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Income footer summary */}
              <div style={{ background: reportData.net_income >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: reportData.net_income >= 0 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', padding: 16, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Net Profit / (Loss) for the Period</span>
                <span style={{ fontSize: '1.1rem', color: reportData.net_income >= 0 ? '#10b981' : '#ef4444' }}>
                  {reportData.net_income.toLocaleString()} EGP
                </span>
              </div>
            </div>
          )}

          {/* Balance Sheet rendering */}
          {reportType === 'balance-sheet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Assets */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>Assets</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {reportData.assets.map((acc: ReportAccount) => (
                      <tr key={acc.id}>
                        <td style={{ ...cellStyle, width: '70%' }}>{acc.code} - {acc.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800, background: 'rgba(0,0,0,0.01)' }}>
                      <td style={cellStyle}>Total Current & Non-Current Assets</td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: 'var(--color-primary)' }}>{reportData.total_assets.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Liabilities */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#8b5cf6', borderBottom: '1px solid var(--border-glass)', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>Liabilities</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {reportData.liabilities.map((acc: ReportAccount) => (
                      <tr key={acc.id}>
                        <td style={{ ...cellStyle, width: '70%' }}>{acc.code} - {acc.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800, background: 'rgba(0,0,0,0.01)' }}>
                      <td style={cellStyle}>Total Liabilities</td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: '#8b5cf6' }}>{reportData.total_liabilities.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equity */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', borderBottom: '1px solid var(--border-glass)', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>Owner's Equity</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {reportData.equity.map((acc: ReportAccount) => (
                      <tr key={acc.id}>
                        <td style={{ ...cellStyle, width: '70%' }}>{acc.code} - {acc.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800, background: 'rgba(0,0,0,0.01)' }}>
                      <td style={cellStyle}>Total Owner's Equity</td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: '#f59e0b' }}>{reportData.total_equity.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Liabilities & Equity sum check */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontWeight: 800 }}>
                  <tbody>
                    <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <td style={{ ...cellStyle, width: '70%', fontSize: '0.85rem' }}>TOTAL LIABILITIES & OWNER'S EQUITY</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-primary)' }}>{reportData.total_liabilities_equity.toLocaleString()} EGP</td>
                    </tr>
                  </tbody>
                </table>

                {/* Double Entry Balance Verification Banner */}
                {reportData.is_balanced ? (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', padding: 14, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                    <ShieldCheck size={20} />
                    <span>Double-Entry ledger checks out successfully. Assets equal Liabilities + Equity ({reportData.total_assets.toLocaleString()} EGP).</span>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', padding: 14, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>
                    <AlertTriangle size={20} />
                    <span>Balance Sheet is out of balance. Check manual journal voucher adjustment entries.</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {!reportData && !loading && (
        <div className="glass-panel" style={{ padding: 45, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <FileText size={40} style={{ opacity: 0.3 }} />
          <div>Please select date parameters and click "Generate Report" to build compliance financial statements.</div>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
