// /api/places.js — Vercel Serverless Function
// Google Places API Proxy (CORS-frei)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, pagetoken } = req.query;
  if (!query && !pagetoken) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!GOOGLE_KEY) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_KEY not configured' });
  }

  try {
    let url;
    if (pagetoken) {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pagetoken}&key=${GOOGLE_KEY}&language=de`;
    } else {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&language=de&region=de`;
    }

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.results && data.results.length > 0) {
      const enriched = await Promise.allSettled(
        data.results.slice(0, 10).map(place => getPlaceDetails(place.place_id, GOOGLE_KEY))
      );
      enriched.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          data.results[i] = { ...data.results[i], ...result.value };
        }
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getPlaceDetails(placeId, apiKey) {
  const fields = 'formatted_phone_number,international_phone_number,website,email';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=de`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    return data.result || {};
  } catch {
    return {};
  }
}
