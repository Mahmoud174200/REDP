import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Globe, DollarSign, Languages, RefreshCw, Plus, Save, Calculator, Search, CheckCircle
} from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status: string;
}

interface ExchangeRate {
  id: string;
  from_currency: { code: string };
  to_currency: { code: string };
  rate: string;
  last_updated_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const GlobalizationSettings: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcFrom, setCalcFrom] = useState('USD');
  const [calcTo, setCalcTo] = useState('EGP');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // Translation State
  const [selectedLocale, setSelectedLocale] = useState('ar');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [searchKey, setSearchKey] = useState('');
  const [editingKey, setEditingKey] = useState<{ group: string; key: string; value: string } | null>(null);
  const [savingTranslation, setSavingTranslation] = useState(false);

  useEffect(() => {
    loadCurrencies();
    loadRates();
    loadTranslations();
  }, [selectedLocale]);

  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/currencies');
      if (res.data?.success) {
        setCurrencies(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadRates = async () => {
    try {
      const res = await api.get('/v1/enterprise/currencies/rates');
      if (res.data?.success) {
        setRates(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTranslations = async () => {
    try {
      const res = await api.get(`/v1/enterprise/translations/${selectedLocale}`);
      if (res.data?.success) {
        setTranslations(res.data.data || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncRates = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/v1/enterprise/currencies/rates/sync');
      if (res.data?.success) {
        alert('Exchange rates synchronized successfully!');
        setRates(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setSyncing(false);
  };

  const handleCalculator = () => {
    const amountVal = parseFloat(calcAmount);
    if (isNaN(amountVal)) return;

    if (calcFrom === calcTo) {
      setCalcResult(amountVal);
      return;
    }

    // Direct search
    const directRate = rates.find(r => r.from_currency.code === calcFrom && r.to_currency.code === calcTo);
    if (directRate) {
      setCalcResult(amountVal * parseFloat(directRate.rate));
      return;
    }

    // Inverse search
    const inverseRate = rates.find(r => r.from_currency.code === calcTo && r.to_currency.code === calcFrom);
    if (inverseRate) {
      setCalcResult(amountVal / parseFloat(inverseRate.rate));
      return;
    }

    // fallback conversion via USD
    const fromToUSD = rates.find(r => r.from_currency.code === calcFrom && r.to_currency.code === 'USD');
    const usdToTarget = rates.find(r => r.from_currency.code === 'USD' && r.to_currency.code === calcTo);
    if (fromToUSD && usdToTarget) {
      setCalcResult(amountVal * parseFloat(fromToUSD.rate) * parseFloat(usdToTarget.rate));
      return;
    }

    alert('Rate multiplier not registered for this pair.');
  };

  const handleSaveTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey || savingTranslation) return;

    setSavingTranslation(true);
    try {
      const res = await api.post('/v1/enterprise/translations', {
        locale: selectedLocale,
        group: editingKey.group,
        key: editingKey.key,
        value: editingKey.value
      });

      if (res.data?.success) {
        alert('Translation saved to database successfully!');
        // Update local state dictionary
        setTranslations(prev => {
          const next = { ...prev };
          if (!next[editingKey.group]) next[editingKey.group] = {};
          next[editingKey.group][editingKey.key] = editingKey.value;
          return next;
        });
        setEditingKey(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving translation key.');
    }
    setSavingTranslation(false);
  };

  // Convert translation record groups into flat array for table search
  const flatTranslations: { group: string; key: string; value: string }[] = [];
  Object.keys(translations).forEach(group => {
    Object.keys(translations[group]).forEach(key => {
      flatTranslations.push({
        group,
        key,
        value: translations[group][key]
      });
    });
  });

  const filteredTranslations = flatTranslations.filter(t => {
    const text = `${t.group} ${t.key} ${t.value}`.toLowerCase();
    return !searchKey || text.includes(searchKey.toLowerCase());
  });

  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={26} color="var(--color-primary)" />
            🌐 Globalization & Multi-Currency Config
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Configure active ledger currencies, track exchange rates, and dynamically translate system labels in real-time.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* LEFT COLUMN: Currencies & Converter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Currency list */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={16} color="var(--color-primary)" /> Currencies & Exchange Rates
              </h3>
              <button className="btn-secondary" onClick={handleSyncRates} style={{ fontSize: '0.72rem', padding: '4px 10px' }} disabled={syncing}>
                <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} style={{ marginRight: 4 }} /> {syncing ? 'Syncing...' : 'Sync Rates'}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading rates...</div>
            ) : rates.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No rates synchronized. Click Sync Rates to pull values.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={headerStyle}>From</th>
                      <th style={headerStyle}>To</th>
                      <th style={headerStyle} style={{ textAlign: 'right', ...headerStyle }}>Multiplier Rate</th>
                      <th style={headerStyle}>Last synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map(rate => (
                      <tr key={rate.id}>
                        <td style={cellStyle}><strong style={{ color: 'var(--color-primary)' }}>{rate.from_currency.code}</strong></td>
                        <td style={cellStyle}><strong style={{ color: 'var(--color-secondary)' }}>{rate.to_currency.code}</strong></td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 800 }}>{parseFloat(rate.rate).toFixed(4)}</td>
                        <td style={{ ...cellStyle, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(rate.last_updated_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Calculator widget */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={16} color="var(--color-primary)" /> Exchange Calculator
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>AMOUNT</label>
                <input style={inputStyle} type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FROM</label>
                <select style={inputStyle} value={calcFrom} onChange={e => setCalcFrom(e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EGP">EGP</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TO</label>
                <select style={inputStyle} value={calcTo} onChange={e => setCalcTo(e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EGP">EGP</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button className="btn-primary" onClick={handleCalculator} style={{ fontSize: '0.78rem' }}>
                Convert Amount
              </button>
              {calcResult !== null && (
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Result: <span style={{ color: 'var(--color-primary)' }}>{calcResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {calcTo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Database Dynamic Translations */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Languages size={16} color="var(--color-primary)" /> Dynamic Translations
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Edit UI interface labels directly inside the DB schema.</p>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select style={{ ...inputStyle, width: '30%', padding: '6px 10px' }} value={selectedLocale} onChange={e => setSelectedLocale(e.target.value)}>
              <option value="ar">Arabic (ar)</option>
              <option value="en">English (en)</option>
            </select>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '0 10px', background: '#fff' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '6px 0' }}
                placeholder="Search keys or values..."
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
              />
            </div>
          </div>

          {/* Translation list table */}
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: 8 }}>Key Name</th>
                  <th style={{ padding: 8 }}>Translated Value</th>
                  <th style={{ padding: 8, width: 40 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTranslations.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                    <td style={{ padding: 8 }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(0,0,0,0.04)', padding: '2px 4px', borderRadius: 2, marginRight: 4 }}>{item.group}</span>
                      <strong style={{ fontFamily: 'monospace' }}>{item.key}</strong>
                    </td>
                    <td style={{ padding: 8, color: 'var(--text-muted)' }}>{item.value}</td>
                    <td style={{ padding: 8 }}>
                      <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '0.65rem' }} onClick={() => setEditingKey(item)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Form */}
          {editingKey && (
            <div style={{ border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: 14, background: 'rgba(99,102,241,0.02)' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Edit Dictionary Item</span>
              <div style={{ fontSize: '0.78rem', marginBottom: 10 }}>
                Group: <strong>{editingKey.group}</strong> | Key: <strong style={{ fontFamily: 'monospace' }}>{editingKey.key}</strong>
              </div>
              <form onSubmit={handleSaveTranslation} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  style={{ ...inputStyle, minHeight: 60, fontFamily: 'inherit' }}
                  value={editingKey.value}
                  onChange={e => setEditingKey(prev => prev ? { ...prev, value: e.target.value } : null)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => setEditingKey(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }} disabled={savingTranslation}>
                    <Save size={10} /> {savingTranslation ? 'Saving...' : 'Save Translation'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalizationSettings;
