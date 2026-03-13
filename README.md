# PraxisNova Sales Automation Tool

Vollautomatischer B2B Sales-Workflow für DACH Bau/Immo/Architektur.

## Features

- 🔍 **Lead-Generierung** via Google Places API (10.000 kostenlos/Monat)
- 📊 **CRM-Integration** — Leads automatisch in HubSpot
- 📧 **6-Email-Sequenz** via Brevo (Tag 1, 4, 8, 13, 19, 26)
- 📅 **Calendly-Link** in jeder Email
- 🔔 **Inbound-Alerts** — Website-Formular → Gmail-Benachrichtigung
- 📥 **CSV-Export** aller Leads

## Setup

### 1. Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
GOOGLE_PLACES_KEY=AIzaSyAUbWDLdKXpOKB0Dy-NZPZ4UHne_XwkEhg
HUBSPOT_TOKEN=<dein HubSpot Token>
BREVO_KEY=xkeysib-0365162db8b4f29b871c7b022421d26abf4151af3cee
HUBSPOT_PORTAL=147989409
```

### 2. Brevo Setup
1. Starter Plan aktivieren (€7/Mo)
2. Liste "Outbound Bau DACH" anlegen → Listen-ID notieren
3. Lists-ID in Tool eintragen (Feld "Brevo Listen-ID")
4. 6 Email-Templates in Brevo anlegen (Texte sind im Tool hinterlegt)
5. Automation: "Kontakt zu Liste hinzugefügt" → startet Sequenz

### 3. Website Inbound-Formular
Formular auf praxisnovaai.com anpassen:

```html
<form onsubmit="submitInbound(event)">
  <input name="name" placeholder="Name" required>
  <input name="email" placeholder="Email" required>
  <input name="company" placeholder="Firma">
  <textarea name="message" placeholder="Nachricht"></textarea>
  <button type="submit">Senden</button>
</form>

<script>
async function submitInbound(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  await fetch('/api/inbound-contact', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  alert('Danke! Wir melden uns.');
}
</script>
```

## Workflow

```
Google Places API → Leads (Name, Adresse, Tel, Website)
→ HubSpot Contact (Status: "In Progress")
→ Brevo Liste → 6-Email-Sequenz startet automatisch
→ Lead antwortet → Exit Condition stoppt Sequenz
→ Vercel Webhook → HubSpot Status: "Replied"
→ Gmail-Alert → Anjuli springt manuell ein
```

## API Keys

| Service | Kosten | Limits |
|---------|--------|--------|
| Google Places | $0 ($300 Guthaben + $200/Mo Credit) | 10.000/Mo kostenlos |
| HubSpot | Kostenlos | Unbegrenzt Contacts |
| Brevo | €7/Mo Starter | 20.000 Emails/Mo |
| Vercel | Kostenlos | 100GB Bandwidth |
| Calendly | Kostenlos | 1 Event-Typ |
