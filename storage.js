// lib/storage.js
// ─────────────────────────────────────────────────────────────────
// Handles saving / loading CRM data from the browser's localStorage
// This means your leads are saved permanently across sessions.
// ─────────────────────────────────────────────────────────────────

const KEYS = {
  LEADS: 'altxen_leads',
  SETTINGS: 'altxen_settings',
  ACTIVITIES: 'altxen_activities',
};

export function saveLeads(leads) {
  try {
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
    return true;
  } catch (e) {
    console.error('Failed to save leads:', e);
    return false;
  }
}

export function loadLeads(fallback = []) {
  try {
    const raw = localStorage.getItem(KEYS.LEADS);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {}
}

export function loadSettings(fallback = {}) {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

// Activity log (audit trail)
export function logActivity(leadId, action, details) {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVITIES) || '[]';
    const logs = JSON.parse(raw);
    logs.unshift({
      id: Date.now(),
      leadId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 activity entries
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(logs.slice(0, 500)));
  } catch (e) {}
}

export function loadActivities(leadId) {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVITIES) || '[]';
    const logs = JSON.parse(raw);
    return leadId ? logs.filter(l => l.leadId === leadId) : logs;
  } catch (e) {
    return [];
  }
}

export function exportLeadsCSV(leads) {
  const headers = [
    'Company','Contact','Title','Department','Email','Phone',
    'City','Country','Employees','Industry','Source','Requirement',
    'Status','Stage','Order Value','AI Score','Score Category',
    'Last Follow-up','Next Follow-up','Assignee','Notes'
  ];
  const rows = leads.map(l => [
    l.company, l.contact, l.title, l.dept, l.email, l.phone,
    l.city, l.country, l.employees, l.industry, l.source, l.requirement,
    l.status, l.stage, l.orderValue, l.score, l.scoreCategory,
    l.lastFollowup, l.nextFollowup, l.assignee,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `altxen-leads-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importLeadsCSV(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const leads = lines.slice(1).map((line, i) => {
      const vals = line.split(',');
      return {
        id: Date.now() + i,
        company: vals[0] || '',
        contact: vals[1] || '',
        title: vals[2] || '',
        dept: vals[3] || 'HR',
        email: vals[4] || '',
        phone: vals[5] || '',
        city: vals[6] || '',
        country: vals[7] || 'India',
        employees: vals[8] || '',
        industry: vals[9] || '',
        source: vals[10] || 'Manual',
        requirement: vals[11] || 'Corporate Gifts',
        status: vals[12] || 'New',
        stage: vals[13] || 'New Lead',
        orderValue: Number(vals[14]) || 0,
        score: Number(vals[15]) || 0,
        scoreCategory: vals[16] || 'Warm',
        lastFollowup: vals[17] || new Date().toISOString().split('T')[0],
        nextFollowup: vals[18] || '',
        assignee: vals[19] || 'Rahul',
        notes: (vals[20] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
        aiSuggestion: 'Score this lead with AI',
      };
    });
    onSuccess(leads);
  };
  reader.readAsText(file);
}
