// /api/places.js
// Google Places API with pagination — returns up to 30 results (3 pages x 10)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    let allResults = [];
    let nextPageToken = null;
    let page = 0;
    const maxPages = 3;

    do {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json`
        + `?query=${encodeURIComponent(query)}`
        + `&key=${apiKey}`
        + `&language=de`;

      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json`
          + `?pagetoken=${nextPageToken}`
          + `&key=${apiKey}`;
      }

      const r = await fetch(url);
      const data = await r.json();

      if (data.status === 'REQUEST_DENIED') {
        return res.status(403).json({ error: 'API key invalid', details: data.error_message });
      }

      if (data.results && data.results.length > 0) {
        const mapped = data.results.map(p => ({
          name:     p.name || '',
          address:  p.formatted_address || '',
          phone:    p.formatted_phone_number || p.international_phone_number || '',
          website:  p.website || '',
          rating:   p.rating || 0,
          placeId:  p.place_id || '',
          email:    extractEmail(p),
          contact:  extractContact(p),
          location: extractCity(p.formatted_address || ''),
          size:     estimateSize(p),
          industry: detectIndustry(p.name || '', p.types || [])
        }));
        allResults = allResults.concat(mapped);
      }

      nextPageToken = data.next_page_token || null;
      page++;

      if (nextPageToken && page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && page < maxPages);

    res.status(200).json({ results: allResults, total: allResults.length });

  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
}

function extractEmail(place) {
  if (place.website) {
    try {
      const domain = new URL(place.website).hostname.replace('www.', '');
      return `info@${domain}`;
    } catch(e) {}
  }
  const slug = (place.name || '').toLowerCase().replace(/gmbh|ag|kg|ug|e\.k\.|&|und/gi,'').replace(/[^a-z0-9]/g,'').slice(0,20);
  return slug ? `info@${slug}.de` : '';
}

function extractContact(place) {
  const types = (place.types || []).join(' ');
  if (types.includes('real_estate')) return 'Geschäftsführer';
  if (place.name && place.name.toLowerCase().includes('architektur')) return 'Inhaber/in';
  return 'Geschäftsführer';
}

function extractCity(address) {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim().replace(/^\d{5}\s*/, '').trim();
  }
  return '';
}

function estimateSize(place) {
  const n = place.user_ratings_total || 0;
  if (n > 500) return '100+ MA';
  if (n > 200) return '50-100 MA';
  if (n > 50)  return '20-50 MA';
  if (n > 10)  return '10-20 MA';
  return '5-10 MA';
}

function detectIndustry(name, types) {
  const n = name.toLowerCase();
  const t = types.join(' ').toLowerCase();
  if (n.includes('architekt') || t.includes('architect')) return 'architektur';
  if (n.includes('immobilien') || n.includes('makler') || t.includes('real_estate')) return 'immobilien';
  if (n.includes('facility') || n.includes('gebäude')) return 'facility';
  return 'bau';
}