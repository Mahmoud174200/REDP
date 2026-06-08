import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  MessageSquare, Phone, Mail, Send, Play, Plus, Search,
  Check, X, FileText, Image, Paperclip, MoreVertical, Smartphone, Globe
} from 'lucide-react';

interface Channel {
  id: string; name: string; type: 'whatsapp' | 'sms' | 'email' | 'facebook' | 'telegram'; provider: string; status: string;
}
interface Conversation {
  id: string; channel_id: string; lead_id: string | null; customer_phone: string; customer_email: string | null;
  customer_name: string | null; assigned_agent_id: string | null; status: 'open' | 'pending' | 'closed';
  last_message_at: string; channel?: Channel; lead?: any; assignee?: any;
}
interface Message {
  id: string; conversation_id: string; direction: 'inbound' | 'outbound'; sender_type: 'customer' | 'agent' | 'system';
  sender_id: string | null; message_type: 'text' | 'image' | 'document' | 'location' | 'audio';
  content: string; file_url: string | null; status: string; created_at: string;
}
interface MsgTemplate {
  id: string; name: string; channel_type: string; content: string; variables: string[] | null;
}

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const MessageHub: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MsgTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected conversation
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // Form states
  const [outboundText, setOutboundText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // New Chat Modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatForm, setNewChatForm] = useState<any>({
    channel_id: '', customer_phone: '', customer_email: '', customer_name: '', initial_message: ''
  });

  // Mock Inbound Trigger State
  const [mockInboundText, setMockInboundText] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [convRes, tempRes] = await Promise.all([
        api.get('/v1/enterprise/omnichannel/conversations'),
        api.get('/v1/enterprise/omnichannel/templates'),
      ]);
      const convList = convRes.data?.data || [];
      setConversations(convList);
      setChannels(convRes.data?.channels || []);
      setTemplates(tempRes.data?.data || []);

      if (convList.length > 0 && !selectedConvId) {
        selectConversation(convList[0]);
      }
    } catch (err) {
      console.error('Error loading Message Hub base data:', err);
    }
    setLoading(false);
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConvId(conv.id);
    setSelectedConv(conv);
    try {
      const res = await api.get(`/v1/enterprise/omnichannel/conversations/${conv.id}/messages`);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Poll messages if active conversation
  useEffect(() => {
    if (!selectedConvId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/v1/enterprise/omnichannel/conversations/${selectedConvId}/messages`);
        setMessages(res.data?.data || []);
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [selectedConvId]);

  const handleSendMessage = async () => {
    if (!selectedConvId || !outboundText.trim()) return;
    try {
      await api.post(`/v1/enterprise/omnichannel/conversations/${selectedConvId}/messages`, {
        content: outboundText,
        message_type: 'text'
      });
      setOutboundText('');
      setSelectedTemplateId('');
      // Reload messages
      const res = await api.get(`/v1/enterprise/omnichannel/conversations/${selectedConvId}/messages`);
      setMessages(res.data?.data || []);
      loadAll(); // Reload last messages in sidebar
    } catch (err) {
      alert('Error sending message');
    }
  };

  const handleApplyTemplate = (tempId: string) => {
    setSelectedTemplateId(tempId);
    const template = templates.find(t => t.id === tempId);
    if (template) {
      // Replace dynamic mock variables
      let content = template.content;
      if (selectedConv) {
        content = content
          .replace('{{name}}', selectedConv.customer_name || 'Customer')
          .replace('{{customer_name}}', selectedConv.customer_name || 'Customer')
          .replace('{{unit_number}}', '101-A')
          .replace('{{amount}}', '250,000 EGP');
      }
      setOutboundText(content);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const res = await api.post('/v1/enterprise/omnichannel/conversations', newChatForm);
      setNewChatModalOpen(false);
      setNewChatForm({
        channel_id: '', customer_phone: '', customer_email: '', customer_name: '', initial_message: ''
      });
      loadAll();
      if (res.data?.data) {
        selectConversation(res.data.data);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error starting conversation');
    }
  };

  // Simulate Inbound message from customer
  const handleTriggerMockInbound = async () => {
    if (!selectedConvId || !mockInboundText.trim()) return;
    try {
      await api.post('/v1/enterprise/omnichannel/receive-mock', {
        conversation_id: selectedConvId,
        content: mockInboundText,
        message_type: 'text'
      });
      setMockInboundText('');
      // Reload messages
      const res = await api.get(`/v1/enterprise/omnichannel/conversations/${selectedConvId}/messages`);
      setMessages(res.data?.data || []);
      loadAll();
    } catch (err) {
      alert('Error simulating inbound response');
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <Smartphone size={16} color="#25D366" />;
      case 'sms': return <Smartphone size={16} color="#3b82f6" />;
      case 'email': return <Mail size={16} color="#ea4335" />;
      case 'facebook': return <Globe size={16} color="#1877f2" />;
      default: return <MessageSquare size={16} color="#6b7280" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={24} color="var(--color-primary)" />
          💬 Omnichannel Message Hub
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Centralized customer conversation vault linking WhatsApp, SMS, and Email gateways under single-agent view
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 20, minHeight: '70vh' }}>
        
        {/* Left Side: Conversations list */}
        <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Active Chats</h3>
            <button className="btn-secondary" onClick={() => { setNewChatForm({ channel_id: channels[0]?.id || '', customer_phone: '', customer_email: '', customer_name: '', initial_message: '' }); setNewChatModalOpen(true); }} style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> New Chat
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.8rem', border: 'none', background: 'transparent' }}
              placeholder="Search chat name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
            {conversations.filter(c => !search || c.customer_name?.toLowerCase().includes(search.toLowerCase())).map(c => {
              const isSelected = selectedConvId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                    background: isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getChannelIcon(c.channel?.type || 'sms')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {c.customer_name || 'Customer'}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {c.customer_phone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Chat box feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedConv && selectedConvId ? (
            <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '60vh' }}>
              
              {/* Chat Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12, marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedConv.customer_name}</h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                    <span>Phone: {selectedConv.customer_phone}</span>
                    {selectedConv.customer_email && <span>Email: {selectedConv.customer_email}</span>}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#10b981', textTransform: 'uppercase' }}>
                    Channel: {selectedConv.channel?.name}
                  </span>
                </div>
              </div>

              {/* Chat Message feed list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 10, background: 'rgba(0,0,0,0.01)', borderRadius: 'var(--radius-md)', marginBottom: 16, maxHeight: 350 }}>
                {messages.map(m => {
                  const isAgent = m.direction === 'outbound';
                  return (
                    <div 
                      key={m.id} 
                      style={{ 
                        maxWidth: '70%', 
                        alignSelf: isAgent ? 'flex-end' : 'flex-start',
                        padding: '10px 14px', borderRadius: 12,
                        background: isAgent ? 'var(--color-primary)' : 'rgba(255,255,255,0.75)',
                        color: isAgent ? '#fff' : 'var(--text-main)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        border: isAgent ? 'none' : '1px solid var(--border-glass)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>{m.content}</div>
                      <div style={{ fontSize: '0.6rem', color: isAgent ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input toolbar */}
              <div>
                {/* Predefined Templates */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>CANNED TEMPLATES:</span>
                  <select style={{ ...inputStyle, width: 220, padding: '4px 8px', fontSize: '0.75rem' }} value={selectedTemplateId} onChange={e => handleApplyTemplate(e.target.value)}>
                    <option value="">-- Apply a Template --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Type your message details..."
                    value={outboundText}
                    onChange={e => setOutboundText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="btn-primary" onClick={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Send size={14} /> Send Outbox
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>
              Select a conversation to resolve chat logs.
            </div>
          )}

          {/* Interactive Mock Customer Response Widget */}
          {selectedConvId && (
            <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.2)' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Play size={14} color="var(--color-primary)" /> Simulated Customer Reply Box
              </h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Enter text below to simulate the customer responding to your gateway dispatch live. Useful for testing chat flow routing!
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.78rem', flex: 1 }} 
                  placeholder="Type inbound reply as customer..." 
                  value={mockInboundText}
                  onChange={e => setMockInboundText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTriggerMockInbound()}
                />
                <button className="btn-secondary" onClick={handleTriggerMockInbound} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  Mock Inbound Reply
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* New Chat Modal */}
      <Modal open={newChatModalOpen} title="Start New Conversation Gateway" onClose={() => setNewChatModalOpen(false)}>
        <Field label="Target Channel Gateway">
          <select style={inputStyle} value={newChatForm.channel_id} onChange={e => setNewChatForm(p => ({ ...p, channel_id: e.target.value }))}>
            {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name} ({ch.type})</option>)}
          </select>
        </Field>
        
        <Field label="Customer Phone"><input style={inputStyle} value={newChatForm.customer_phone} onChange={e => setNewChatForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+20100..." /></Field>
        <Field label="Customer Name (Optional)"><input style={inputStyle} value={newChatForm.customer_name} onChange={e => setNewChatForm(p => ({ ...p, customer_name: e.target.value }))} /></Field>
        <Field label="Customer Email (Optional)"><input style={inputStyle} value={newChatForm.customer_email} onChange={e => setNewChatForm(p => ({ ...p, customer_email: e.target.value }))} /></Field>
        <Field label="Initial Message Content"><textarea style={{ ...inputStyle, minHeight: 60 }} value={newChatForm.initial_message || ''} onChange={e => setNewChatForm(p => ({ ...p, initial_message: e.target.value }))} placeholder="Type first incoming or outgoing text..." /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={handleCreateNewChat} style={{ flex: 1 }}>Start Chat</button>
          <button className="btn-secondary" onClick={() => setNewChatModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default MessageHub;
