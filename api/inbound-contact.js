// /api/inbound-contact.js — Vercel Serverless Function
// Inbound: Website-Formular → HubSpot + Gmail-Alert

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, company, message, phone } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
  const BREVO_KEY = process.env.BREVO_KEY;

  const results = { hubspot: false, brevo: false };

  try {
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          firstname: name?.split(' ')[0] || name || '',
          lastname: name?.split(' ').slice(1).join(' ') || '',
          email,
          company: company || '',
          phone: phone || '',
          message: message || '',
          hs_lead_status: 'NEW',
          lead_source: 'Website Inbound — praxisnovaai.com',
        }
      })
    });
    results.hubspot = resp.ok || resp.status === 409;
  } catch(e) {
    console.error('HubSpot error:', e.message);
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'PraxisNova Automation', email: 'hertle.anjuli@praxisnovaai.com' },
        to: [{ email: 'hertle.anjuli@praxisnovaai.com', name: 'Anjuli Hertle' }],
        subject: `🔔 Neue Inbound-Anfrage: ${name || email}`,
        htmlContent: `<div style="font-family:sans-serif"><h2>Neue Anfrage</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Firma:</b> ${company}</p><p><b>Nachricht:</b> ${message}</p></div>`,
      })
    });
    results.brevo = resp.ok;
  } catch(e) {
    console.error('Brevo error:', e.message);
  }

  return res.status(200).json({ success: true, ...results });
}
