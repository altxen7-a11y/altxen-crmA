# 🚀 Altxen CRM — Complete Setup & Deployment Guide

## What You're Getting
- ✅ Full CRM running at your own URL (e.g. altxen-crm.vercel.app)
- ✅ Works on any device — laptop, phone, tablet
- ✅ Leads saved permanently (localStorage)
- ✅ AI scoring, briefings, email drafts via Claude API
- ✅ Free hosting on Vercel
- ✅ Takes about 15–20 minutes to set up

---

## STEP 1 — Get Your Anthropic API Key

1. Go to → https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** in the left menu
4. Click **+ Create Key**
5. Name it "altxen-crm"
6. **Copy the key** — it starts with `sk-ant-...`
7. Save it somewhere safe (you'll need it in Step 4)

---

## STEP 2 — Create a GitHub Account (if you don't have one)

1. Go to → https://github.com
2. Click **Sign up** (it's free)
3. Verify your email

---

## STEP 3 — Upload the CRM to GitHub

### Option A — Using GitHub Website (Easiest, No coding needed)

1. Go to → https://github.com/new
2. Repository name: `altxen-crm`
3. Set to **Private** (important — keeps your code secure)
4. Click **Create repository**
5. On the next page, click **uploading an existing file**
6. Upload ALL the project files (maintaining folder structure)
7. Click **Commit changes**

### Option B — Using Terminal (Faster if you have Git)

```bash
# Navigate to the project folder
cd altxen-crm

# Initialize git
git init
git add .
git commit -m "Initial Altxen CRM"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/altxen-crm.git
git push -u origin main
```

---

## STEP 4 — Deploy to Vercel (Free Hosting)

1. Go to → https://vercel.com
2. Click **Sign up** → choose **Continue with GitHub**
3. Authorize Vercel to access your GitHub
4. Click **Add New Project**
5. Find and click **altxen-crm** in the list
6. Click **Import**
7. **IMPORTANT — Add Environment Variable:**
   - Click **Environment Variables**
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-YOUR_KEY_HERE` (paste your real key)
   - Click **Add**
8. Click **Deploy**
9. Wait ~2 minutes...
10. 🎉 Your CRM is live at: `https://altxen-crm.vercel.app`

---

## STEP 5 — Access Your CRM Daily

**Bookmark your URL** — it's something like:
`https://altxen-crm-yourname.vercel.app`

**On Mobile:**
- Open the URL in Chrome/Safari
- Tap **Share → Add to Home Screen**
- Now it works like an app!

---

## STEP 6 — Using the CRM

### First Time Setup
1. Open your CRM URL
2. The 8 sample Indian B2B leads are pre-loaded
3. Click any lead → **🤖 AI Score** to score it
4. Click **Dashboard → ⚡ Generate** for your AI briefing

### Daily Workflow
```
Morning:
  1. Dashboard → Generate AI Briefing
  2. Follow-ups → check Overdue + Today sections
  3. Mark done as you call

During Day:
  4. Add new leads → + Add Lead button
  5. Update stages in Pipeline view
  6. Click any lead → AI Insight for talking points

Evening:
  7. Analytics → check team performance
  8. Pipeline → move deals forward
```

### Add Your Real Leads
- Click **+ Add Lead** (top right)
- Fill in company details
- Click **🤖 AI Score** → AI gives score + action
- Set Next Follow-up date
- Save

---

## TROUBLESHOOTING

### "AI unavailable" error
→ Check your API key in Vercel:
1. Go to vercel.com → your project → Settings → Environment Variables
2. Make sure ANTHROPIC_API_KEY is set correctly
3. Redeploy: Deployments → three dots → Redeploy

### Lost my leads data
→ Data is stored in your browser's localStorage
→ Don't clear browser data / use incognito mode
→ For team use or backup, use **Export CSV** button in Leads view

### Want to update the CRM
→ Edit files in GitHub → Vercel auto-deploys in ~2 minutes

---

## UPGRADE PATH

When you're ready to scale:

| Need | Solution |
|------|----------|
| Multiple users | Add Supabase database (~$0/month free tier) |
| Email notifications | Add Resend.com integration |
| Mobile app | Wrap in Capacitor.js |
| WhatsApp reminders | Add Twilio integration |
| Google Sheets sync | Add Google Sheets API |

---

## FILE STRUCTURE (for reference)

```
altxen-crm/
├── pages/
│   ├── index.js          ← Main page
│   ├── _app.js           ← App wrapper
│   └── api/
│       └── claude.js     ← AI API (secure, server-side)
├── components/
│   └── AltxenCRM.jsx     ← Full CRM application
├── lib/
│   └── storage.js        ← Data persistence
├── styles/
│   └── globals.css       ← Base styles
├── .env.example          ← Template for API key
├── .gitignore            ← Protects secrets
├── next.config.js        ← Next.js config
└── package.json          ← Dependencies
```

---

## NEED HELP?

If you get stuck at any step, share:
1. Which step you're on
2. What error message you see

And we'll fix it together!
