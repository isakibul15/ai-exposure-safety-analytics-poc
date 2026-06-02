// ─────────────────────────────────────────────────────────────
// OpenRouter  ·  Claude claude-sonnet-4-5 integration
// Used by RAG Pipeline / AI Assistant panel
// ─────────────────────────────────────────────────────────────
import {
  exposureTrendData,
  latestExposureByArea,
  metalsMeasurements,
  riskMatrixData,
  bloodLeadData,
  complianceDonutData,
  recentMeasurements,
} from '../data/safetyData';
import { mockEmployees, mockSensors, mockIngestionLogs } from '../data/couchbaseSchema';

const API_URL  = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY  = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL    = import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5';

// ── Build a rich system prompt with all safety data ───────────
function buildSystemPrompt() {
  return `You are SafetyAI, an expert chemical workplace safety analytics assistant for **Stena Recycling NF** in Halmstad, Sweden. You have full access to the facility's safety database (Couchbase chemsafe / safety_ops) and answer questions based on real measurement data.

## FACILITY
- Name: Stena Recycling NF, Halmstad, Sweden
- Last assessment: 2026-05-28  |  Last measurement campaign: 2026-03-11
- Ventilation capacity: 128,885 l/s  |  12 monitored work areas
- Compliance standard: AFS 2020:6 (Swedish OHS occupational exposure limits)

## EXPOSURE TREND (% of NGV — 8 campaigns 2020–2026)
${JSON.stringify(exposureTrendData, null, 2)}

## LATEST EXPOSURE BY WORK AREA
${JSON.stringify(latestExposureByArea, null, 2)}

## METALS MEASUREMENTS (10 metals tracked)
${JSON.stringify(metalsMeasurements, null, 2)}

## RISK MATRIX (12 active risk items)
${JSON.stringify(riskMatrixData, null, 2)}

## BLOOD LEAD MONITORING — quarterly 2022–2025 (µmol/L)
${JSON.stringify(bloodLeadData, null, 2)}

## COMPLIANCE DISTRIBUTION
${JSON.stringify(complianceDonutData, null, 2)}

## RECENT MEASUREMENTS (14 samples — latest campaigns)
${JSON.stringify(recentMeasurements, null, 2)}

## EMPLOYEES (12 active — biomonitoring: BPb, BCd, UAs)
${JSON.stringify(mockEmployees, null, 2)}

## IOT SENSORS (12 sensors — real-time telemetry)
${JSON.stringify(mockSensors, null, 2)}

## INGESTED DOCUMENTS (67 source files in Couchbase)
${JSON.stringify(mockIngestionLogs.map(l => ({ id: l.id, file: l.file, category: l.category, chunks: l.chunks, status: l.status })), null, 2)}

## INSTRUCTIONS
- Answer questions about exposure levels, compliance, risk scores, blood lead results, sensor data, and employees using the data above.
- When quoting numbers, be precise and cite the source field/campaign.
- Use Swedish occupational health terminology where appropriate (NGV = nivågränsvärde, BPb = blood lead, BCd = blood cadmium, UAs = urinary arsenic).
- If asked about a specific area or substance, find it in the data and give a thorough analysis.
- When giving risk advice, reference AFS 2020:6 limits.
- Format responses with **bold** for key values and bullet points for lists.
- Keep responses concise but complete. Max 400 words unless a detailed analysis is requested.`;
}

// ── Non-streaming fetch (simple query) ───────────────────────
export async function askSafetyAI(userMessage, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chemsafe-safety-analytics.poc',
      'X-Title': 'SafetyAI – Stena Recycling NF',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.2,
      system: buildSystemPrompt(),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('OpenRouter error ' + res.status + ': ' + err);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '(no response)';
}

// ── Streaming fetch — calls onChunk(text) for each token ──────
export async function askSafetyAIStream(userMessage, history = [], onChunk, onDone, onError) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chemsafe-safety-analytics.poc',
        'X-Title': 'SafetyAI – Stena Recycling NF',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.2,
        stream: true,
        system: buildSystemPrompt(),
        messages,
      }),
    });
  } catch (e) {
    onError && onError(e.message);
    return;
  }

  if (!res.ok) {
    const err = await res.text();
    onError && onError('OpenRouter ' + res.status + ': ' + err);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') { onDone && onDone(full); return; }
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.delta?.content ?? '';
          if (text) {
            full += text;
            onChunk && onChunk(text, full);
          }
        } catch { /* skip malformed SSE chunks */ }
      }
    }
  } catch (e) {
    onError && onError(e.message);
  }

  onDone && onDone(full);
}

// ── Semantic search simulation (sends top-K context + query) ──
export async function semanticSearch(query) {
  const prompt = `Perform a semantic search over the safety database for: "${query}"

Return exactly 5 results as a JSON array with this shape:
[{ "score": 0.00, "chunk": "...", "source": "filename.csv", "docType": "category" }]

score = cosine similarity 0–1 (descending), chunk = relevant excerpt from the data, source = which file/collection it came from, docType = category label.

Only return valid JSON, no other text.`;

  const raw = await askSafetyAI(prompt);
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}
