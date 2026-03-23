// components/AltxenCRM.jsx
// Full CRM with persistent storage + secure AI via /api/claude

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { saveLeads, loadLeads, loadSettings, saveSettings, exportLeadsCSV, importLeadsCSV, logActivity, loadActivities } from "../lib/storage";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const STAGES = ["New Lead","Qualified","Requirement Received","Quotation Sent","Sampling","Negotiation","Order Confirmed","Production","Delivered","Repeat Order"];
const STATUSES = ["New","Contacted","Follow-up","Proposal Sent","Negotiation","Won","Lost"];
const SOURCES = ["Apollo","Website","Referral","LinkedIn","RFQ","Email","Cold Call","Manual"];
const REQUIREMENTS = ["Corporate Gifts","Joining Kit","Brand Store","Event Merchandise","Employee Kit","Festive Gifts"];
const DEPARTMENTS = ["HR","Admin","Marketing","Procurement","TA","L&D","Finance","C-Suite","Operations"];
const INDUSTRIES = ["Information Technology","Banking & Finance","Manufacturing","Pharma","FMCG","E-Commerce","Consulting","Healthcare","Automotive","Real Estate","Education","Telecom"];
const ASSIGNEES = ["Rahul","Sneha","Vikram","Priya","Admin"];

const INITIAL_LEADS = [
  {id:1,company:"Infosys Limited",contact:"Priya Sharma",title:"HR Manager",dept:"HR",email:"priya.sharma@infosys.com",phone:"+91 98765 43210",city:"Bangalore",country:"India",employees:"50000+",industry:"Information Technology",source:"LinkedIn",requirement:"Joining Kit",status:"Follow-up",stage:"Quotation Sent",orderValue:450000,notes:"Premium onboarding kits for 2000 new joinees Q1. Needs sampling first.",lastFollowup:"2026-03-18",nextFollowup:"2026-03-24",score:87,scoreCategory:"Hot",aiSuggestion:"Send proposal today – sampling approved",assignee:"Rahul"},
  {id:2,company:"TCS",contact:"Amit Verma",title:"Procurement Head",dept:"Procurement",email:"amit.v@tcs.com",phone:"+91 97654 32109",city:"Mumbai",country:"India",employees:"500000+",industry:"Information Technology",source:"RFQ",requirement:"Festive Gifts",status:"Proposal Sent",stage:"Sampling",orderValue:800000,notes:"Diwali gifting for 5000 employees. Budget ~8L. Needs catalog by March end.",lastFollowup:"2026-03-20",nextFollowup:"2026-03-23",score:92,scoreCategory:"Hot",aiSuggestion:"Follow up on proposal – decision this week",assignee:"Sneha"},
  {id:3,company:"Kotak Mahindra Bank",contact:"Neha Gupta",title:"HR Director",dept:"HR",email:"neha.g@kotak.com",phone:"+91 96543 21098",city:"Mumbai",country:"India",employees:"10000+",industry:"Banking & Finance",source:"Apollo",requirement:"Employee Kit",status:"Contacted",stage:"Qualified",orderValue:220000,notes:"New employee welcome kits. Sent catalog. Waiting for response.",lastFollowup:"2026-03-15",nextFollowup:"2026-03-25",score:74,scoreCategory:"Warm",aiSuggestion:"Call today – 10 days since last contact",assignee:"Rahul"},
  {id:4,company:"Persistent Systems",contact:"Ravi Naik",title:"L&D Manager",dept:"L&D",email:"ravi.n@persistent.com",phone:"+91 95432 10987",city:"Pune",country:"India",employees:"5000+",industry:"Information Technology",source:"Website",requirement:"Corporate Gifts",status:"Negotiation",stage:"Negotiation",orderValue:350000,notes:"Training completion gifts. Final negotiation on pricing. Very close to closing.",lastFollowup:"2026-03-21",nextFollowup:"2026-03-23",score:95,scoreCategory:"Hot",aiSuggestion:"High priority – close this deal today",assignee:"Sneha"},
  {id:5,company:"Wipro Limited",contact:"Suresh Patel",title:"Admin Manager",dept:"Admin",email:"suresh.p@wipro.com",phone:"+91 94321 09876",city:"Hyderabad",country:"India",employees:"200000+",industry:"Information Technology",source:"Email",requirement:"Brand Store",status:"New",stage:"New Lead",orderValue:600000,notes:"Company branded merchandise store. Responded to cold email.",lastFollowup:"2026-03-22",nextFollowup:"2026-03-24",score:78,scoreCategory:"Warm",aiSuggestion:"Qualify the requirement – high potential",assignee:"Rahul"},
  {id:6,company:"HDFC Bank",contact:"Kavita Joshi",title:"Head of HR",dept:"HR",email:"kavita.j@hdfc.com",phone:"+91 93210 98765",city:"Mumbai",country:"India",employees:"100000+",industry:"Banking & Finance",source:"Referral",requirement:"Festive Gifts",status:"Won",stage:"Order Confirmed",orderValue:1200000,notes:"Won Diwali campaign order. 10,000 gifting units confirmed.",lastFollowup:"2026-03-10",nextFollowup:"2026-04-01",score:100,scoreCategory:"Hot",aiSuggestion:"Upsell – explore repeat order for Holi",assignee:"Sneha"},
  {id:7,company:"HCL Technologies",contact:"Deepak Rao",title:"TA Head",dept:"TA",email:"deepak.r@hcl.com",phone:"+91 92109 87654",city:"Noida",country:"India",employees:"100000+",industry:"Information Technology",source:"LinkedIn",requirement:"Joining Kit",status:"Follow-up",stage:"Requirement Received",orderValue:380000,notes:"Joining kits for Q2 batch. 3000 new hires. Needs premium packaging.",lastFollowup:"2026-03-17",nextFollowup:"2026-03-26",score:82,scoreCategory:"Hot",aiSuggestion:"Send quotation – requirement is clear",assignee:"Rahul"},
  {id:8,company:"Reliance Industries",contact:"Pradeep Singh",title:"HR Head",dept:"HR",email:"pradeep.s@ril.com",phone:"+91 89876 54321",city:"Mumbai",country:"India",employees:"200000+",industry:"Manufacturing",source:"RFQ",requirement:"Corporate Gifts",status:"Proposal Sent",stage:"Quotation Sent",orderValue:2000000,notes:"Large corporate gifting Pan-India annual day. 20,000 units. Strategic account.",lastFollowup:"2026-03-20",nextFollowup:"2026-03-23",score:98,scoreCategory:"Hot",aiSuggestion:"CEO-level follow-up needed – 2Cr deal",assignee:"Sneha"},
];

// ── THEME ─────────────────────────────────────────────────────────────────────
const light = {dark:false,bg:"#F0F4F8",card:"#FFFFFF",cardAlt:"#F8FAFC",sidebar:"#0C1929",sidebarText:"rgba(255,255,255,0.55)",border:"#E2E8F0",text:"#0F172A",textMuted:"#64748B",textLight:"#94A3B8",accent:"#F59E0B",hot:"#DC2626",hotBg:"#FEF2F2",hotText:"#991B1B",warm:"#EA580C",warmBg:"#FFF7ED",warmText:"#9A3412",cold:"#2563EB",coldBg:"#EFF6FF",coldText:"#1E40AF",won:"#059669",wonBg:"#ECFDF5",wonText:"#065F46",purple:"#7C3AED",input:"#F8FAFC",inputBorder:"#CBD5E1",shadow:"0 1px 3px rgba(0,0,0,0.08)",shadowMd:"0 4px 12px rgba(0,0,0,0.1)",modalOverlay:"rgba(15,23,42,0.6)"};
const dark  = {dark:true, bg:"#060D1A",card:"#0C1929",cardAlt:"#0F2040",sidebar:"#050B16",sidebarText:"rgba(255,255,255,0.45)",border:"#1A3254",text:"#E2E8F0",textMuted:"#64748B",textLight:"#475569",accent:"#F59E0B",hot:"#F87171",hotBg:"rgba(220,38,38,0.12)",hotText:"#FCA5A5",warm:"#FB923C",warmBg:"rgba(234,88,12,0.12)",warmText:"#FDBA74",cold:"#60A5FA",coldBg:"rgba(37,99,235,0.12)",coldText:"#93C5FD",won:"#34D399",wonBg:"rgba(5,150,105,0.12)",wonText:"#6EE7B7",purple:"#A78BFA",input:"#0A1628",inputBorder:"#1A3254",shadow:"0 1px 3px rgba(0,0,0,0.3)",shadowMd:"0 4px 16px rgba(0,0,0,0.4)",modalOverlay:"rgba(3,7,18,0.8)"};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = n => n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:`₹${(n/1000).toFixed(0)}K`;
const initials = n => (n||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const daysUntil = d => Math.round((new Date(d)-new Date())/(86400000));
const today = new Date().toISOString().split('T')[0];
const statusColors = {Won:'#059669',Lost:'#94A3B8',Negotiation:'#7C3AED','Proposal Sent':'#2563EB','Follow-up':'#F59E0B',Contacted:'#06B6D4',New:'#64748B'};
const reqIcons = {'Corporate Gifts':'🎁','Joining Kit':'📦','Brand Store':'🏪','Event Merchandise':'🎪','Employee Kit':'💼','Festive Gifts':'🪔'};
const CHART_COLORS = ['#F59E0B','#3B82F6','#10B981','#8B5CF6','#EF4444','#06B6D4','#F97316'];

// ── AI CALLS (via secure server proxy) ────────────────────────────────────────
async function claudeCall(prompt, maxTokens = 1000) {
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: maxTokens }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text || '';
  } catch (e) {
    console.error('AI call failed:', e);
    return `⚠️ AI unavailable: ${e.message}`;
  }
}

async function aiScoreLead(lead) {
  const p = `You are an AI sales scoring engine for Altxen.com (B2B corporate gifting in India).
Analyze this B2B lead and return ONLY valid JSON (no markdown, no explanation):
Company: ${lead.company} | Contact: ${lead.contact} (${lead.title}) | Dept: ${lead.dept}
Industry: ${lead.industry} | Employees: ${lead.employees} | Requirement: ${lead.requirement}
Order Value: ${fmt(lead.orderValue||0)} | Status: ${lead.status} | Source: ${lead.source}
Notes: ${lead.notes}
Scoring: Large IT/BFSI company + Senior HR/Procurement title + clear gifting requirement + high budget = higher score.
Return JSON: {"score":<0-100>,"category":"Hot|Warm|Cold","suggestion":"<one action sentence under 15 words>","summary":"<2 sentence insight>"}`;
  const text = await claudeCall(p);
  try { return JSON.parse(text.replace(/```json|```/g,'').trim()); }
  catch { return { score:50, category:'Warm', suggestion:'Follow up with the lead soon', summary:'Lead requires further qualification to determine potential.' }; }
}

async function aiDailyBriefing(leads) {
  const active = leads.filter(l => !['Won','Lost'].includes(l.status));
  const overdue = active.filter(l => l.nextFollowup <= today);
  const hot = active.filter(l => l.scoreCategory === 'Hot');
  const p = `You are a sales AI for Altxen.com (B2B corporate gifting). Today is ${today}.
Overdue: ${overdue.map(l=>`${l.company}(${l.requirement},${fmt(l.orderValue||0)})`).join('; ')||'None'}.
Hot active: ${hot.map(l=>`${l.company}-${l.aiSuggestion}`).join('; ')||'None'}.
Write a crisp daily sales briefing. Exactly 4 bullet points. Each starts with •. Focus on deals closable this week. Be specific about company names. Under 100 words total.`;
  return claudeCall(p);
}

async function aiLeadSummary(lead) {
  const p = `Generate a sharp sales insight for this B2B corporate gifting lead for Altxen.com:
${lead.company} | ${lead.contact}, ${lead.title} | ${lead.industry} | ${lead.employees} employees
Requirement: ${lead.requirement} | Value: ${fmt(lead.orderValue||0)} | Stage: ${lead.stage} | Status: ${lead.status}
Notes: ${lead.notes}
Write exactly 3 sentences:
1) Profile: who they are and what they need.
2) Opportunity/risk assessment.
3) Exact next action with timeline.`;
  return claudeCall(p);
}

async function aiGenerateEmailDraft(lead) {
  const p = `Write a concise, professional follow-up email from Altxen.com to ${lead.contact} at ${lead.company}.
Context: ${lead.requirement} | Stage: ${lead.stage} | Value: ${fmt(lead.orderValue||0)} | Notes: ${lead.notes}
Format: Subject line first, then email body. Keep it under 120 words. Friendly but professional tone. End with a clear CTA.`;
  return claudeCall(p, 400);
}

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(245,158,11,0.3)`, borderTop:`2px solid #F59E0B`, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}/>;
}

function ScoreBadge({ lead, t }) {
  const [tc, bg] = lead.scoreCategory==='Hot' ? [t.hotText, t.hotBg] : lead.scoreCategory==='Warm' ? [t.warmText, t.warmBg] : [t.coldText, t.coldBg];
  const border = lead.scoreCategory==='Hot' ? t.hot : lead.scoreCategory==='Warm' ? t.warm : t.cold;
  return <span style={{ background:bg, color:tc, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, border:`1px solid ${border}22`, whiteSpace:'nowrap' }}>{lead.scoreCategory} {lead.score}</span>;
}

function Avatar({ name, size=32, color='#F59E0B' }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:`${color}22`, color, fontSize:size*0.36, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{initials(name)}</div>;
}

function StatCard({ label, value, sub, color, icon, t }) {
  return (
    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:'16px 20px', boxShadow:t.shadow }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:700, color:color||t.text, letterSpacing:'-0.03em', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:12, color:t.textMuted, marginTop:5 }}>{sub}</div>}
        </div>
        <div style={{ fontSize:20, opacity:0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>`,
  leads: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>`,
  pipeline: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>`,
  followups: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>`,
  analytics: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>`,
};

function Sidebar({ view, setView, t, leads }) {
  const overdue = leads.filter(l => l.nextFollowup <= today && !['Won','Lost'].includes(l.status)).length;
  const NAV = [
    { id:'dashboard', label:'Dashboard' },
    { id:'leads', label:'Leads' },
    { id:'pipeline', label:'Pipeline' },
    { id:'followups', label:'Follow-ups' },
    { id:'analytics', label:'Analytics' },
  ];
  return (
    <div style={{ width:220, minWidth:220, background:t.sidebar, display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0 }}>
      <div style={{ padding:'22px 20px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'#F59E0B', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#000', letterSpacing:'-0.05em' }}>A</div>
          <div>
            <div style={{ color:'#fff', fontSize:15, fontWeight:700, letterSpacing:'-0.02em' }}>Altxen</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>CRM v1.0</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, padding:'6px 10px', overflowY:'auto' }}>
        {NAV.map(item => {
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, marginBottom:2, background:active?'rgba(245,158,11,0.15)':'transparent', border:'none', cursor:'pointer', color:active?'#F59E0B':t.sidebarText, fontSize:14, fontWeight:active?600:400, textAlign:'left', position:'relative', transition:'all 0.15s' }}>
              <span style={{ width:18, height:18, flexShrink:0, opacity:active?1:0.65 }} dangerouslySetInnerHTML={{ __html:NAV_ICONS[item.id] }}/>
              <span>{item.label}</span>
              {item.id==='followups' && overdue>0 && <span style={{ marginLeft:'auto', background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99 }}>{overdue}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name="Admin User" size={30} color="#F59E0B"/>
          <div>
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500 }}>Admin</div>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>Sales Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LEAD MODAL ────────────────────────────────────────────────────────────────
const EMPTY = { company:'', contact:'', title:'', dept:'HR', email:'', phone:'', city:'', country:'India', employees:'', industry:'Information Technology', source:'Apollo', requirement:'Corporate Gifts', status:'New', stage:'New Lead', orderValue:'', notes:'', lastFollowup:today, nextFollowup:'', score:0, scoreCategory:'Warm', aiSuggestion:'', assignee:'Rahul' };

function LeadModal({ lead, onClose, onSave, t, isNew }) {
  const [form, setForm] = useState(lead || EMPTY);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [tab, setTab] = useState('details'); // details | ai | email | activity
  const [activities, setActivities] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (lead?.id) setActivities(loadActivities(lead.id));
  }, [lead?.id]);

  async function handleAIScore() {
    setAiLoading(true);
    const res = await aiScoreLead(form);
    setForm(f => ({ ...f, score: res.score, scoreCategory: res.category, aiSuggestion: res.suggestion }));
    setAiSummary(res.summary || '');
    setAiLoading(false);
  }

  async function handleAISummary() {
    setAiLoading(true);
    const s = await aiLeadSummary(form);
    setAiSummary(s);
    setTab('ai');
    setAiLoading(false);
  }

  async function handleEmailDraft() {
    setAiLoading(true);
    const e = await aiGenerateEmailDraft(form);
    setEmailDraft(e);
    setTab('email');
    setAiLoading(false);
  }

  function handleSave() {
    const saved = { ...form, orderValue: Number(form.orderValue) || 0, id: form.id || Date.now() };
    logActivity(saved.id, isNew ? 'Created' : 'Updated', `${saved.status} · ${saved.stage}`);
    onSave(saved);
  }

  const inp = { background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:7, padding:'8px 11px', fontSize:13, color:t.text, width:'100%', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:600, color:t.textMuted, marginBottom:4, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };
  const r2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 };

  return (
    <div style={{ position:'fixed', inset:0, background:t.modalOverlay, zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }}>
      <div style={{ background:t.card, borderRadius:14, width:'100%', maxWidth:740, border:`1px solid ${t.border}`, boxShadow:t.shadowMd }}>
        {/* Header */}
        <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${t.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:t.text }}>{isNew ? '+ New Lead' : form.company}</h2>
            {!isNew && <p style={{ margin:'2px 0 0', fontSize:12, color:t.textMuted }}>{form.contact} · {form.title} · {form.city}</p>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {!isNew && <button onClick={handleEmailDraft} style={{ background:'transparent', border:`1px solid ${t.border}`, padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', color:t.textMuted, display:'flex', alignItems:'center', gap:5 }}>{aiLoading ? <Spinner size={12}/> : '📧'} Email</button>}
            {!isNew && <button onClick={handleAISummary} style={{ background:t.dark?'rgba(245,158,11,0.1)':'#FFFBEB', color:'#92400E', border:`1px solid ${t.accent}44`, padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>{aiLoading ? <Spinner size={12}/> : '✨'} Insight</button>}
            <button onClick={handleAIScore} style={{ background:'#F59E0B', color:'#000', border:'none', padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>{aiLoading ? <Spinner size={12}/> : '🤖'} AI Score</button>
            <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${t.border}`, padding:'6px 10px', borderRadius:7, cursor:'pointer', color:t.textMuted, fontSize:13 }}>✕</button>
          </div>
        </div>

        {/* Score strip */}
        {form.score > 0 && (
          <div style={{ background:form.scoreCategory==='Hot'?t.hotBg:form.scoreCategory==='Warm'?t.warmBg:t.coldBg, borderBottom:`1px solid ${t.border}`, padding:'10px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color:form.scoreCategory==='Hot'?t.hot:form.scoreCategory==='Warm'?t.warm:t.cold, lineHeight:1 }}>{form.score}</div>
              <div style={{ fontSize:10, color:t.textMuted, fontWeight:600, textTransform:'uppercase' }}>Score</div>
            </div>
            <div style={{ width:1, height:32, background:t.border }}/>
            <div style={{ fontSize:13, fontWeight:500, color:t.text }}>{form.scoreCategory} Lead — {form.aiSuggestion}</div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${t.border}`, padding:'0 22px' }}>
          {[['details','Details'],['ai','AI Insights'],['email','Email Draft'],['activity','Activity']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:'10px 16px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===id?'#F59E0B':'transparent'}`, cursor:'pointer', fontSize:13, fontWeight:tab===id?600:400, color:tab===id?'#F59E0B':t.textMuted }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding:'18px 22px', overflowY:'auto', maxHeight:'60vh' }}>

          {tab === 'details' && (
            <div style={{ display:'grid', gap:13 }}>
              <div style={r2}>
                <div><label style={lbl}>Company Name *</label><input style={inp} value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Infosys Limited"/></div>
                <div><label style={lbl}>Contact Person *</label><input style={inp} value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Full name"/></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Job Title</label><input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="HR Manager"/></div>
                <div><label style={lbl}>Department</label><select style={inp} value={form.dept} onChange={e=>set('dept',e.target.value)}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="contact@company.com"/></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Mumbai"/></div>
                <div><label style={lbl}>Country</label><input style={inp} value={form.country} onChange={e=>set('country',e.target.value)} placeholder="India"/></div>
                <div><label style={lbl}>Employees</label><input style={inp} value={form.employees} onChange={e=>set('employees',e.target.value)} placeholder="5000+"/></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Industry</label><select style={inp} value={form.industry} onChange={e=>set('industry',e.target.value)}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
                <div><label style={lbl}>Lead Source</label><select style={inp} value={form.source} onChange={e=>set('source',e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Requirement Type</label><select style={inp} value={form.requirement} onChange={e=>set('requirement',e.target.value)}>{REQUIREMENTS.map(r=><option key={r}>{r}</option>)}</select></div>
                <div><label style={lbl}>Expected Order Value (₹)</label><input style={inp} type="number" value={form.orderValue} onChange={e=>set('orderValue',e.target.value)} placeholder="500000"/></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Lead Status</label><select style={inp} value={form.status} onChange={e=>set('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={lbl}>Pipeline Stage</label><select style={inp} value={form.stage} onChange={e=>set('stage',e.target.value)}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Last Follow-up</label><input style={inp} type="date" value={form.lastFollowup} onChange={e=>set('lastFollowup',e.target.value)}/></div>
                <div><label style={lbl}>Next Follow-up</label><input style={inp} type="date" value={form.nextFollowup} onChange={e=>set('nextFollowup',e.target.value)}/></div>
              </div>
              <div style={r2}>
                <div><label style={lbl}>Assigned To</label><select style={inp} value={form.assignee} onChange={e=>set('assignee',e.target.value)}>{ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Notes</label><textarea style={{ ...inp, minHeight:80, resize:'vertical', lineHeight:1.5 }} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Requirements, budget discussed, key details..."/></div>
            </div>
          )}

          {tab === 'ai' && (
            <div>
              {aiLoading && <div style={{ display:'flex', alignItems:'center', gap:10, color:t.textMuted, fontSize:14, padding:'20px 0' }}><Spinner/> Generating AI insight...</div>}
              {aiSummary && !aiLoading && (
                <div style={{ background:t.dark?'rgba(245,158,11,0.07)':'#FFFBEB', border:`1px solid ${t.accent}33`, borderRadius:10, padding:'16px 18px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:10 }}>🤖 AI Analysis — {form.company}</div>
                  {aiSummary.split('\n').filter(l=>l.trim()).map((line,i) => (
                    <div key={i} style={{ fontSize:13, color:t.text, lineHeight:1.7, marginBottom:6, paddingLeft:16, borderLeft:`2px solid ${t.accent}66` }}>{line}</div>
                  ))}
                </div>
              )}
              {!aiSummary && !aiLoading && (
                <div style={{ textAlign:'center', padding:'30px 0', color:t.textMuted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
                  <p style={{ margin:0, fontSize:14 }}>Click <strong>AI Insight</strong> button above to generate analysis</p>
                </div>
              )}
            </div>
          )}

          {tab === 'email' && (
            <div>
              {aiLoading && <div style={{ display:'flex', alignItems:'center', gap:10, color:t.textMuted, fontSize:14, padding:'20px 0' }}><Spinner/> Drafting email...</div>}
              {emailDraft && !aiLoading && (
                <div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
                    <button onClick={() => navigator.clipboard?.writeText(emailDraft)} style={{ background:t.cardAlt, border:`1px solid ${t.border}`, padding:'6px 12px', borderRadius:7, fontSize:12, cursor:'pointer', color:t.textMuted }}>📋 Copy</button>
                  </div>
                  <textarea value={emailDraft} onChange={e=>setEmailDraft(e.target.value)} style={{ ...inp, minHeight:220, resize:'vertical', lineHeight:1.7, fontFamily:'inherit' }}/>
                </div>
              )}
              {!emailDraft && !aiLoading && (
                <div style={{ textAlign:'center', padding:'30px 0', color:t.textMuted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📧</div>
                  <p style={{ margin:0, fontSize:14 }}>Click <strong>Email Draft</strong> button above to generate a follow-up email</p>
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div>
              {activities.length === 0 && <p style={{ color:t.textMuted, fontSize:13 }}>No activity recorded yet.</p>}
              {activities.map(a => (
                <div key={a.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${t.border}` }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', marginTop:5, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:t.text }}>{a.action}</div>
                    <div style={{ fontSize:12, color:t.textMuted }}>{a.details}</div>
                    <div style={{ fontSize:11, color:t.textLight, marginTop:2 }}>{new Date(a.timestamp).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:'14px 22px', borderTop:`1px solid ${t.border}`, display:'flex', gap:10, justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:t.textMuted }}>
            {form.orderValue ? <span>💰 {fmt(Number(form.orderValue)||0)}</span> : null}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${t.border}`, padding:'9px 20px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500, color:t.textMuted }}>Cancel</button>
            <button onClick={handleSave} style={{ background:'#F59E0B', color:'#000', border:'none', padding:'9px 24px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>{isNew ? '+ Add Lead' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ leads, t, setView, onViewLead }) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const active = leads.filter(l => !['Won','Lost'].includes(l.status));
    const won = leads.filter(l => l.status === 'Won');
    return {
      total: leads.length,
      hot: active.filter(l => l.scoreCategory === 'Hot').length,
      active: active.length,
      won: won.length,
      wonVal: won.reduce((s,l) => s+l.orderValue, 0),
      pipeline: active.reduce((s,l) => s+l.orderValue, 0),
      conversion: leads.length ? Math.round((won.length/leads.length)*100) : 0,
      overdue: active.filter(l => l.nextFollowup <= today && l.nextFollowup).length,
    };
  }, [leads]);

  const todayTasks = useMemo(() => leads.filter(l => l.nextFollowup <= today && l.nextFollowup && !['Won','Lost'].includes(l.status)).sort((a,b) => b.score-a.score).slice(0,6), [leads]);
  const hotLeads = useMemo(() => leads.filter(l => l.scoreCategory==='Hot' && !['Won','Lost'].includes(l.status)).sort((a,b) => b.score-a.score).slice(0,5), [leads]);
  const sourceData = useMemo(() => { const m={}; leads.forEach(l=>{m[l.source]=(m[l.source]||0)+1;}); return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value); }, [leads]);

  async function loadBriefing() { setLoading(true); const b = await aiDailyBriefing(leads); setBriefing(b); setLoading(false); }

  return (
    <div style={{ padding:'18px 26px', overflowY:'auto', flex:1 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        <StatCard label="Total Leads" value={stats.total} sub={`${stats.active} active`} icon="👥" t={t}/>
        <StatCard label="Hot Leads" value={stats.hot} sub="Score ≥ 80" color={t.hot} icon="🔥" t={t}/>
        <StatCard label="Pipeline Value" value={fmt(stats.pipeline)} sub={`${stats.active} deals`} color={t.purple} icon="💰" t={t}/>
        <StatCard label="Conversion Rate" value={`${stats.conversion}%`} sub={`${stats.won} won · ${fmt(stats.wonVal)}`} color={t.won} icon="🏆" t={t}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Today Tasks */}
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:18, boxShadow:t.shadow }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:t.text }}>📋 Today's Tasks</h3>
              {stats.overdue > 0 && <p style={{ margin:'2px 0 0', fontSize:12, color:t.hot }}>⚠️ {stats.overdue} overdue</p>}
            </div>
            <button onClick={() => setView('followups')} style={{ fontSize:12, color:t.accent, background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>View all →</button>
          </div>
          {todayTasks.length === 0
            ? <p style={{ color:t.textMuted, fontSize:13, textAlign:'center', padding:'16px 0' }}>🎉 No tasks due today!</p>
            : todayTasks.map(l => (
              <div key={l.id} onClick={() => onViewLead(l)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:`1px solid ${t.border}`, cursor:'pointer' }}>
                <ScoreBadge lead={l} t={t}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:t.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.company}</div>
                  <div style={{ fontSize:11, color:t.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.aiSuggestion || l.contact}</div>
                </div>
                <span style={{ fontSize:11, color:daysUntil(l.nextFollowup)<=0?t.hot:t.warm, fontWeight:600, whiteSpace:'nowrap' }}>{daysUntil(l.nextFollowup)<=0?'Overdue':`${daysUntil(l.nextFollowup)}d`}</span>
              </div>
            ))
          }
        </div>

        {/* AI Briefing */}
        <div style={{ background:t.dark?'rgba(245,158,11,0.06)':'#FFFBEB', border:`1px solid ${t.accent}33`, borderRadius:12, padding:18, boxShadow:t.shadow }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:t.text }}>🤖 AI Sales Briefing</h3>
              <p style={{ margin:'2px 0 0', fontSize:12, color:t.textMuted }}>Daily AI priorities for your team</p>
            </div>
            <button onClick={loadBriefing} style={{ background:'#F59E0B', color:'#000', border:'none', padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>{loading ? <Spinner/> : '⚡'} Generate</button>
          </div>
          {loading && <div style={{ display:'flex', alignItems:'center', gap:10, color:t.textMuted, fontSize:13 }}><Spinner/> Analyzing pipeline...</div>}
          {briefing && !loading && briefing.split('\n').filter(l=>l.trim()).map((line,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:9, fontSize:13, color:t.text, lineHeight:1.55 }}>
              <span style={{ color:t.accent, flexShrink:0 }}>•</span>
              <span>{line.replace(/^[•\-\*]\s*/,'')}</span>
            </div>
          ))}
          {!briefing && !loading && <div style={{ textAlign:'center', padding:'18px 0', color:t.textMuted, fontSize:13 }}>Click Generate for your AI briefing</div>}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:18, boxShadow:t.shadow }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600, color:t.text }}>📡 Lead Sources</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={sourceData} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:t.textMuted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:t.textMuted }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:8, fontSize:12 }} cursor={{ fill:`${t.accent}15` }}/>
              <Bar dataKey="value" fill="#F59E0B" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:18, boxShadow:t.shadow }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:t.text }}>🔥 Hot Leads</h3>
            <button onClick={() => setView('leads')} style={{ fontSize:12, color:t.accent, background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>All →</button>
          </div>
          {hotLeads.map(l => (
            <div key={l.id} onClick={() => onViewLead(l)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${t.border}`, cursor:'pointer' }}>
              <Avatar name={l.company} size={30} color="#F59E0B"/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:t.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.company}</div>
                <div style={{ fontSize:11, color:t.textMuted }}>{reqIcons[l.requirement]} {l.requirement}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:14, fontWeight:700, color:t.hot }}>{l.score}</div>
                <div style={{ fontSize:11, color:t.textMuted }}>{fmt(l.orderValue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LEADS VIEW ────────────────────────────────────────────────────────────────
function LeadsView({ leads, setLeads, t, initialLead }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [filterReq, setFilterReq] = useState('All');
  const [selected, setSelected] = useState(initialLead || null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState(-1);
  const fileRef = useState(null)[0];

  useEffect(() => { if (initialLead) setSelected(initialLead); }, [initialLead]);

  const filtered = useMemo(() => {
    let r = [...leads];
    if (search) r = r.filter(l => [l.company,l.contact,l.email,l.city,l.industry,l.requirement].join(' ').toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== 'All') r = r.filter(l => l.status === filterStatus);
    if (filterCat !== 'All') r = r.filter(l => l.scoreCategory === filterCat);
    if (filterSource !== 'All') r = r.filter(l => l.source === filterSource);
    if (filterReq !== 'All') r = r.filter(l => l.requirement === filterReq);
    r.sort((a,b) => { const av=a[sortKey]||0, bv=b[sortKey]||0; return typeof av==='string' ? av.localeCompare(bv)*sortDir : (bv-av)*sortDir; });
    return r;
  }, [leads, search, filterStatus, filterCat, filterSource, filterReq, sortKey, sortDir]);

  function saveLead(form) {
    if (showAdd) { setLeads(ls => [...ls, form]); setShowAdd(false); }
    else { setLeads(ls => ls.map(l => l.id===form.id ? form : l)); setSelected(null); }
  }

  function deleteLead(id) {
    if (confirm('Delete this lead? This cannot be undone.')) { setLeads(ls => ls.filter(l => l.id !== id)); setSelected(null); }
  }

  const th = { fontSize:11, fontWeight:700, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 12px', textAlign:'left', cursor:'pointer', whiteSpace:'nowrap', userSelect:'none' };
  const td = { padding:'12px 12px', fontSize:13, color:t.text, borderBottom:`1px solid ${t.border}` };

  return (
    <div style={{ padding:'18px 26px', flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
      {/* Controls */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by company, contact, city..." style={{ background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:8, padding:'8px 14px', fontSize:13, color:t.text, outline:'none', minWidth:240, flex:'0 0 auto' }}/>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:7, padding:'8px 11px', fontSize:12, color:t.textMuted, outline:'none' }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:7, padding:'8px 11px', fontSize:12, color:t.textMuted, outline:'none' }}>
          <option value="All">All Scores</option>
          <option>Hot</option><option>Warm</option><option>Cold</option>
        </select>
        <select value={filterSource} onChange={e=>setFilterSource(e.target.value)} style={{ background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:7, padding:'8px 11px', fontSize:12, color:t.textMuted, outline:'none' }}>
          <option value="All">All Sources</option>
          {SOURCES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterReq} onChange={e=>setFilterReq(e.target.value)} style={{ background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:7, padding:'8px 11px', fontSize:12, color:t.textMuted, outline:'none' }}>
          <option value="All">All Requirements</option>
          {REQUIREMENTS.map(r=><option key={r}>{r}</option>)}
        </select>
        <span style={{ marginLeft:'auto', fontSize:12, color:t.textMuted, whiteSpace:'nowrap' }}>{filtered.length} leads</span>
        <button onClick={() => exportLeadsCSV(leads)} style={{ background:t.card, border:`1px solid ${t.border}`, padding:'7px 12px', borderRadius:7, fontSize:12, cursor:'pointer', color:t.textMuted }}>📥 Export CSV</button>
      </div>

      {/* Table */}
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, overflow:'auto', boxShadow:t.shadow, flex:1 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
          <thead style={{ background:t.cardAlt, position:'sticky', top:0 }}>
            <tr>
              <th style={th} onClick={() => { setSortKey('company'); setSortDir(d => -d); }}>Company ↕</th>
              <th style={th}>Contact</th>
              <th style={th}>Requirement</th>
              <th style={th} onClick={() => { setSortKey('orderValue'); setSortDir(d => -d); }}>Value ↕</th>
              <th style={th}>Source</th>
              <th style={th}>Status</th>
              <th style={th} onClick={() => { setSortKey('score'); setSortDir(d => -d); }}>Score ↕</th>
              <th style={th}>Next F/U</th>
              <th style={th}>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id} onClick={() => setSelected(lead)} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=t.cardAlt} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={td}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <Avatar name={lead.company} size={28} color="#F59E0B"/>
                    <div>
                      <div style={{ fontWeight:600 }}>{lead.company}</div>
                      <div style={{ fontSize:11, color:t.textMuted }}>{lead.city} · {lead.employees}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>
                  <div style={{ fontWeight:500 }}>{lead.contact}</div>
                  <div style={{ fontSize:11, color:t.textMuted }}>{lead.title} · {lead.dept}</div>
                </td>
                <td style={td}><span style={{ fontSize:13 }}>{reqIcons[lead.requirement]}</span> <span style={{ fontSize:12 }}>{lead.requirement}</span></td>
                <td style={td}><span style={{ fontWeight:700, color:t.purple }}>{fmt(lead.orderValue||0)}</span></td>
                <td style={td}><span style={{ background:t.cardAlt, border:`1px solid ${t.border}`, fontSize:11, padding:'2px 8px', borderRadius:99, color:t.textMuted }}>{lead.source}</span></td>
                <td style={td}><span style={{ background:`${statusColors[lead.status]}22`, color:statusColors[lead.status], fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:99 }}>{lead.status}</span></td>
                <td style={td}><ScoreBadge lead={lead} t={t}/></td>
                <td style={td}><span style={{ fontSize:12, color:lead.nextFollowup<=today?t.hot:t.textMuted, fontWeight:lead.nextFollowup<=today?700:400 }}>{lead.nextFollowup<=today&&lead.nextFollowup?'⚠️ Overdue':lead.nextFollowup||'—'}</span></td>
                <td style={td}><div style={{ display:'flex', alignItems:'center', gap:6 }}><Avatar name={lead.assignee||'?'} size={22} color="#3B82F6"/><span style={{ fontSize:12 }}>{lead.assignee}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:'40px', textAlign:'center', color:t.textMuted, fontSize:14 }}>No leads match your filters</div>}
      </div>

      {selected && <LeadModal lead={selected} onClose={() => setSelected(null)} onSave={saveLead} t={t} isNew={false}/>}
      {showAdd && <LeadModal lead={null} onClose={() => setShowAdd(false)} onSave={saveLead} t={t} isNew={true}/>}
    </div>
  );
}

// ── PIPELINE VIEW ─────────────────────────────────────────────────────────────
function PipelineView({ leads, setLeads, t }) {
  const [selected, setSelected] = useState(null);

  const stageLeads = useMemo(() => {
    const m = {};
    STAGES.forEach(s => { m[s] = leads.filter(l => l.stage === s).sort((a,b) => b.score-a.score); });
    return m;
  }, [leads]);

  const stageColors = { 'New Lead':'#64748B','Qualified':'#06B6D4','Requirement Received':'#3B82F6','Quotation Sent':'#8B5CF6','Sampling':'#F59E0B','Negotiation':'#EF4444','Order Confirmed':'#10B981','Production':'#059669','Delivered':'#047857','Repeat Order':'#F59E0B' };

  function moveStage(lead, dir) {
    const idx = STAGES.indexOf(lead.stage);
    const newStage = STAGES[idx+dir];
    if (!newStage) return;
    setLeads(ls => ls.map(l => l.id===lead.id ? {...l, stage:newStage} : l));
    logActivity(lead.id, 'Stage moved', `${lead.stage} → ${newStage}`);
  }

  return (
    <div style={{ padding:'18px 0 18px 26px', flex:1, overflowX:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', gap:10, flex:1, minHeight:0, paddingRight:26 }}>
        {STAGES.map(stage => {
          const col = stageColors[stage];
          const stageL = stageLeads[stage] || [];
          const val = stageL.reduce((s,l) => s+l.orderValue, 0);
          return (
            <div key={stage} style={{ minWidth:210, width:210, flexShrink:0, display:'flex', flexDirection:'column', background:t.card, border:`1px solid ${t.border}`, borderRadius:12, overflow:'hidden', boxShadow:t.shadow }}>
              <div style={{ padding:'11px 13px', borderBottom:`1px solid ${t.border}`, borderTop:`3px solid ${col}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:t.text, marginBottom:2 }}>{stage}</div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, color:t.textMuted }}>{stageL.length} leads</span>
                  {val>0 && <span style={{ fontSize:11, fontWeight:600, color:col }}>{fmt(val)}</span>}
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'7px' }}>
                {stageL.map(lead => (
                  <div key={lead.id} style={{ background:t.cardAlt, border:`1px solid ${t.border}`, borderRadius:8, padding:'9px 11px', marginBottom:7, cursor:'pointer' }} onClick={() => setSelected(lead)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:t.text, lineHeight:1.3, flex:1, marginRight:6 }}>{lead.company}</div>
                      <ScoreBadge lead={lead} t={t}/>
                    </div>
                    <div style={{ fontSize:11, color:t.textMuted, marginBottom:5 }}>{lead.contact}</div>
                    <div style={{ fontSize:11, marginBottom:6 }}>{reqIcons[lead.requirement]} {lead.requirement}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:t.purple, marginBottom:7 }}>{fmt(lead.orderValue||0)}</div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={e=>{e.stopPropagation();moveStage(lead,-1);}} style={{ flex:1, background:'transparent', border:`1px solid ${t.border}`, borderRadius:5, padding:'4px', fontSize:11, cursor:'pointer', color:t.textMuted }}>← Back</button>
                      <button onClick={e=>{e.stopPropagation();moveStage(lead,1);}} style={{ flex:1, background:`${col}22`, border:`1px solid ${col}44`, borderRadius:5, padding:'4px', fontSize:11, cursor:'pointer', color:col, fontWeight:600 }}>Next →</button>
                    </div>
                  </div>
                ))}
                {stageL.length===0 && <div style={{ textAlign:'center', padding:'18px 6px', color:t.textLight, fontSize:11 }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
      {selected && <LeadModal lead={selected} onClose={() => setSelected(null)} onSave={(f) => { setLeads(ls => ls.map(l => l.id===f.id ? f : l)); setSelected(null); }} t={t} isNew={false}/>}
    </div>
  );
}

// ── FOLLOW-UPS VIEW ───────────────────────────────────────────────────────────
function FollowupsView({ leads, setLeads, t }) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const overdue  = useMemo(() => leads.filter(l => l.nextFollowup < today && l.nextFollowup && !['Won','Lost'].includes(l.status)).sort((a,b) => b.score-a.score), [leads]);
  const dueToday = useMemo(() => leads.filter(l => l.nextFollowup === today && !['Won','Lost'].includes(l.status)).sort((a,b) => b.score-a.score), [leads]);
  const upcoming = useMemo(() => leads.filter(l => l.nextFollowup > today && daysUntil(l.nextFollowup)<=7 && !['Won','Lost'].includes(l.status)).sort((a,b) => new Date(a.nextFollowup)-new Date(b.nextFollowup)), [leads]);
  const noActivity = useMemo(() => leads.filter(l => { const d=(new Date()-new Date(l.lastFollowup))/86400000; return d>14 && !['Won','Lost'].includes(l.status); }).sort((a,b) => b.score-a.score), [leads]);

  async function loadBriefing() { setLoading(true); const b = await aiDailyBriefing(leads); setBriefing(b); setLoading(false); }

  function markDone(lead) {
    const nfd = new Date(); nfd.setDate(nfd.getDate()+3);
    const nf = nfd.toISOString().split('T')[0];
    setLeads(ls => ls.map(l => l.id===lead.id ? {...l, lastFollowup:today, nextFollowup:nf, status:l.status==='New'?'Contacted':l.status} : l));
    logActivity(lead.id, 'Follow-up done', `Next set to ${nf}`);
  }

  function TaskItem({ lead, badge }) {
    const days = daysUntil(lead.nextFollowup);
    return (
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:10, padding:'12px 14px', marginBottom:7, display:'flex', alignItems:'center', gap:12, boxShadow:t.shadow }}>
        <Avatar name={lead.company} size={36} color={lead.scoreCategory==='Hot'?t.hot:lead.scoreCategory==='Warm'?t.warm:t.cold}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
            <span style={{ fontSize:13, fontWeight:600, color:t.text }}>{lead.company}</span>
            <ScoreBadge lead={lead} t={t}/>
          </div>
          <div style={{ fontSize:12, color:t.textMuted }}>{lead.contact} ({lead.title}) · {reqIcons[lead.requirement]} {lead.requirement} · {fmt(lead.orderValue||0)}</div>
          <div style={{ fontSize:12, color:t.accent, marginTop:3 }}>💡 {lead.aiSuggestion || 'Follow up with this lead'}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end', flexShrink:0 }}>
          {badge}
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={() => setSelected(lead)} style={{ background:t.cardAlt, border:`1px solid ${t.border}`, padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', color:t.textMuted }}>Edit</button>
            <button onClick={() => markDone(lead)} style={{ background:'#10B98122', border:'1px solid #10B98144', padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', color:t.won, fontWeight:600 }}>✓ Done</button>
          </div>
        </div>
      </div>
    );
  }

  function Section({ title, items, badge, emptyText }) {
    return (
      <div style={{ marginBottom:22 }}>
        <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:700, color:t.text }}>{title} <span style={{ fontSize:12, color:t.textMuted, fontWeight:400 }}>({items.length})</span></h3>
        {items.length === 0 ? <p style={{ color:t.textMuted, fontSize:13, margin:0 }}>{emptyText || 'Nothing here 🎉'}</p> : items.map(l => <TaskItem key={l.id} lead={l} badge={badge && badge(l)}/>)}
      </div>
    );
  }

  return (
    <div style={{ padding:'18px 26px', flex:1, overflowY:'auto' }}>
      {/* Briefing panel */}
      <div style={{ background:t.dark?'rgba(245,158,11,0.06)':'#FFFBEB', border:`1px solid ${t.accent}33`, borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:14 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:4 }}>🤖 AI Daily Briefing</div>
          {loading && <div style={{ display:'flex', alignItems:'center', gap:8, color:t.textMuted, fontSize:13 }}><Spinner/> Generating...</div>}
          {briefing && !loading && briefing.split('\n').filter(l=>l.trim()).map((line,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13, color:t.text, lineHeight:1.55 }}>
              <span style={{ color:t.accent }}>•</span><span>{line.replace(/^[•\-\*]\s*/,'')}</span>
            </div>
          ))}
          {!briefing && !loading && <p style={{ margin:0, fontSize:13, color:t.textMuted }}>Get AI-powered daily sales priorities</p>}
        </div>
        <button onClick={loadBriefing} style={{ background:'#F59E0B', color:'#000', border:'none', padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>{loading?<Spinner/>:'⚡'} Generate</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <StatCard label="Overdue" value={overdue.length} color={t.hot} icon="🚨" t={t}/>
        <StatCard label="Due Today" value={dueToday.length} color={t.warm} icon="📅" t={t}/>
        <StatCard label="This Week" value={upcoming.length} color={t.cold} icon="⏰" t={t}/>
        <StatCard label="No Activity 14d+" value={noActivity.length} color={t.textMuted} icon="😴" t={t}/>
      </div>

      <Section title="🚨 Overdue" items={overdue} badge={l=><span style={{ background:t.hotBg, color:t.hot, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{Math.abs(daysUntil(l.nextFollowup))}d late</span>} emptyText="No overdue follow-ups 🎉"/>
      <Section title="📅 Due Today" items={dueToday} badge={()=><span style={{ background:t.warmBg, color:t.warm, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>Today</span>} emptyText="Nothing due today"/>
      <Section title="⏰ This Week" items={upcoming} badge={l=><span style={{ background:t.coldBg, color:t.cold, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99 }}>{daysUntil(l.nextFollowup)}d</span>} emptyText="Nothing upcoming this week"/>
      <Section title="😴 No Activity (14+ days)" items={noActivity} emptyText="All leads have recent activity"/>

      {selected && <LeadModal lead={selected} onClose={() => setSelected(null)} onSave={(f) => { setLeads(ls => ls.map(l => l.id===f.id ? f : l)); setSelected(null); }} t={t} isNew={false}/>}
    </div>
  );
}

// ── ANALYTICS VIEW ────────────────────────────────────────────────────────────
function AnalyticsView({ leads, t }) {
  const won = leads.filter(l => l.status === 'Won');
  const active = leads.filter(l => !['Won','Lost'].includes(l.status));

  const sourcePerf = useMemo(() => SOURCES.map(s => {
    const sl = leads.filter(l => l.source===s);
    const sw = sl.filter(l => l.status==='Won');
    return { source:s, total:sl.length, won:sw.length, value:sw.reduce((a,l)=>a+l.orderValue,0), rate:sl.length?Math.round((sw.length/sl.length)*100):0 };
  }).filter(x=>x.total>0).sort((a,b)=>b.total-a.total), [leads]);

  const reqData = useMemo(() => REQUIREMENTS.map(r => ({ name:r, value:leads.filter(l=>l.requirement===r).length, pipeline:leads.filter(l=>l.requirement===r&&!['Won','Lost'].includes(l.status)).reduce((a,l)=>a+l.orderValue,0) })).filter(x=>x.value>0), [leads]);
  const stageData = useMemo(() => STAGES.map(s=>({ stage:s.length>12?s.substring(0,10)+'…':s, count:leads.filter(l=>l.stage===s).length })), [leads]);
  const assigneePerf = useMemo(() => ASSIGNEES.map(a => { const al=leads.filter(l=>l.assignee===a); return {name:a,total:al.length,hot:al.filter(l=>l.scoreCategory==='Hot').length,won:al.filter(l=>l.status==='Won').length,value:al.reduce((s,l)=>s+l.orderValue,0)}; }).filter(x=>x.total>0), [leads]);

  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const monthlyData = months.map((m,i) => ({ month:m, leads:Math.round(6+i*2.5+(Math.random()*3)), won:Math.round(2+i*0.8) }));
  monthlyData[5] = { month:'Mar', leads:leads.length, won:won.length };

  function Chart({ title, children, h=180 }) {
    return (
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:'16px 18px', boxShadow:t.shadow }}>
        <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600, color:t.text }}>{title}</h3>
        <div style={{ height:h }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ padding:'18px 26px', flex:1, overflowY:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
        <StatCard label="Total Leads" value={leads.length} icon="👥" t={t}/>
        <StatCard label="Hot" value={leads.filter(l=>l.scoreCategory==='Hot').length} color={t.hot} icon="🔥" t={t}/>
        <StatCard label="Pipeline" value={fmt(active.reduce((a,l)=>a+l.orderValue,0))} color={t.purple} icon="💰" t={t}/>
        <StatCard label="Won Revenue" value={fmt(won.reduce((a,l)=>a+l.orderValue,0))} color={t.won} icon="🏆" t={t}/>
        <StatCard label="Conversion" value={`${leads.length?Math.round((won.length/leads.length)*100):0}%`} color={t.accent} icon="📈" t={t}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Chart title="📈 Monthly Performance" h={190}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,fontSize:12}}/>
              <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="url(#gl)" strokeWidth={2} name="Leads"/>
              <Area type="monotone" dataKey="won" stroke="#10B981" fill="url(#gw)" strokeWidth={2} name="Won"/>
            </AreaChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="🎁 Requirements Breakdown" h={190}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={reqData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                {reqData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,fontSize:12}} formatter={(v,n)=>[`${v} leads`,n]}/>
            </PieChart>
          </ResponsiveContainer>
        </Chart>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Chart title="📡 Lead Source Performance" h={170}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourcePerf} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="source" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,fontSize:12}}/>
              <Bar dataKey="total" fill="#3B82F6" radius={[3,3,0,0]} name="Total"/>
              <Bar dataKey="won" fill="#10B981" radius={[3,3,0,0]} name="Won"/>
            </BarChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="🏆 Team Performance" h={170}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%', justifyContent:'center' }}>
            {assigneePerf.map((a,i) => (
              <div key={a.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar name={a.name} size={26} color={CHART_COLORS[i]}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:t.text }}>{a.name}</span>
                    <span style={{ fontSize:11, color:t.textMuted }}>{a.total} leads · {a.won} won · {fmt(a.value)}</span>
                  </div>
                  <div style={{ background:t.border, borderRadius:99, height:4, overflow:'hidden' }}>
                    <div style={{ background:CHART_COLORS[i], height:'100%', width:`${leads.length?Math.min(100,(a.total/leads.length)*100):0}%`, borderRadius:99 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Chart>
      </div>

      <Chart title="🔄 Pipeline Stage Distribution" h={150}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stageData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
            <XAxis dataKey="stage" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,fontSize:12}}/>
            <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]} name="Leads"/>
          </BarChart>
        </ResponsiveContainer>
      </Chart>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function AltxenCRM() {
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [pendingLead, setPendingLead] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const t = darkMode ? dark : light;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadLeads(INITIAL_LEADS);
    setLeads(saved);
    const settings = loadSettings({ darkMode: false });
    setDarkMode(settings.darkMode || false);
    setLoaded(true);
  }, []);

  // Save to localStorage whenever leads change
  useEffect(() => {
    if (loaded) saveLeads(leads);
  }, [leads, loaded]);

  // Save settings
  useEffect(() => {
    if (loaded) saveSettings({ darkMode });
  }, [darkMode, loaded]);

  // Wrap setLeads to auto-save
  const updateLeads = useCallback((updater) => {
    setLeads(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  function handleAddLead(form) {
    updateLeads(ls => [...ls, form]);
    setShowAdd(false);
  }

  function saveLead(form) {
    updateLeads(ls => ls.map(l => l.id===form.id ? form : l));
    setPendingLead(null);
  }

  const titles = {
    dashboard: ['Dashboard', `${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})} — Welcome back 👋`],
    leads:     ['Leads', `${leads.length} total · ${leads.filter(l=>l.scoreCategory==='Hot'&&!['Won','Lost'].includes(l.status)).length} hot leads`],
    pipeline:  ['Pipeline', 'Drag deals through stages to track progress'],
    followups: ['Follow-ups', `${leads.filter(l=>l.nextFollowup<=today&&!['Won','Lost'].includes(l.status)).length} overdue · ${leads.filter(l=>l.nextFollowup===today&&!['Won','Lost'].includes(l.status)).length} due today`],
    analytics: ['Analytics', 'Performance insights and conversion metrics'],
  };

  if (!loaded) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#060D1A', color:'#F59E0B', fontSize:18, fontWeight:600, gap:12 }}><Spinner size={24}/> Loading Altxen CRM...</div>;
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:t.bg, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', overflow:'hidden' }}>
      <style>{`*{box-sizing:border-box;}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${t.border};border-radius:99px}input,select,textarea,button{font-family:inherit}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <Sidebar view={view} setView={setView} t={t} leads={leads}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 26px 0', flexShrink:0 }}>
          <div>
            <h1 style={{ margin:0, fontSize:21, fontWeight:700, color:t.text, letterSpacing:'-0.03em' }}>{titles[view][0]}</h1>
            <p style={{ margin:'2px 0 0', fontSize:12, color:t.textMuted }}>{titles[view][1]}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {['leads','followups','pipeline'].includes(view) && (
              <button onClick={() => setShowAdd(true)} style={{ background:'#F59E0B', color:'#000', border:'none', padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add Lead</button>
            )}
            <button onClick={() => setDarkMode(d => !d)} style={{ background:t.card, border:`1px solid ${t.border}`, padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:14, color:t.textMuted }}>{darkMode?'☀️':'🌙'}</button>
          </div>
        </div>

        {view==='dashboard' && <Dashboard leads={leads} t={t} setView={setView} onViewLead={l=>{setPendingLead(l);setView('leads');}}/>}
        {view==='leads'     && <LeadsView leads={leads} setLeads={updateLeads} t={t} initialLead={pendingLead}/>}
        {view==='pipeline'  && <PipelineView leads={leads} setLeads={updateLeads} t={t}/>}
        {view==='followups' && <FollowupsView leads={leads} setLeads={updateLeads} t={t}/>}
        {view==='analytics' && <AnalyticsView leads={leads} t={t}/>}
      </div>

      {showAdd && <LeadModal lead={null} onClose={() => setShowAdd(false)} onSave={handleAddLead} t={t} isNew={true}/>}
    </div>
  );
}
