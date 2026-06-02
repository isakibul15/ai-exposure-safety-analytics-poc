// ─────────────────────────────────────────────────────────────
// Groq  ·  ChemSafe AI (Llama 3.3 70B) integration
// Used by RAG Pipeline / AI Assistant panel + ChatWidget + RecommendationsCard
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

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL   = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

// ── Compact data helpers (minimise token usage) ───────────────

// Employees: only fields needed for analysis
function empCompact() {
  return mockEmployees.map(e => ({
    id: e.id, role: e.role, zone: e.zone, gender: e.gender,
    bpb: e.bloodLead, bpbLim: e.limit, bpbPct: e.pct,
    bcd: e.bloodCadmium, bcdLim: e.cdLimit,
  }));
}

// Sensors: strip model / lastCalibrated
function sensorCompact() {
  return mockSensors.map(s => ({
    id: s.id, area: s.area, type: s.type,
    val: s.value, ngv: s.ngv, pct: s.pct, status: s.status,
  }));
}

// Ingestion logs: replace 67-entry array with a category count summary
function logSummary() {
  const counts = mockIngestionLogs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});
  return { totalFiles: mockIngestionLogs.length, byCategory: counts };
}

// ── ChemSafe AI System Prompt (compact — stays under 8k tokens) ─
function buildSystemPrompt() {
  return `You are ChemSafe AI, an expert occupational health and safety assistant for the Swedish metal recycling industry. Base all answers strictly on the data below and these references:
- ICSCs (International Chemical Safety Cards)
- Farliga ämnen – MSB RIB | ECHA CHEM
- Rapport 2014:10 (carcinogena kemikalier, samverkanseffekter)
- GreenMetalWaste study (metal & dust exposure in Swedish recycling workers)
- Rapport 2014:1 (hälsorelaterad arbetsmiljöövervakning)
- AFS 2020:6 (Swedish OHS NGV limits) | AFS 2011:19 (biomonitoring BPb/BCd)
Answer in English unless the user asks for Swedish.

FACILITY: Stena Recycling NF, Halmstad, Sweden. Last assessment 2026-05-28. Campaign 2026-03-11. Ventilation 128,885 l/s. 12 work areas.

EXPOSURE TREND (% of NGV, 8 campaigns 2020–2026):
${JSON.stringify(exposureTrendData)}

LATEST EXPOSURE BY AREA:
${JSON.stringify(latestExposureByArea)}

METALS (10 tracked):
${JSON.stringify(metalsMeasurements)}

RISK MATRIX (12 items):
${JSON.stringify(riskMatrixData)}

BLOOD LEAD – quarterly 2022–2025 (µmol/L):
${JSON.stringify(bloodLeadData)}

COMPLIANCE DISTRIBUTION:
${JSON.stringify(complianceDonutData)}

RECENT MEASUREMENTS (14 samples):
${JSON.stringify(recentMeasurements)}

EMPLOYEES (12 active – bpb=BPb µmol/L, bpbLim=limit, bpbPct=% of limit, bcd=BCd nmol/L, bcdLim=limit):
${JSON.stringify(empCompact())}

IOT SENSORS (12 – val=current reading, ngv=limit, pct=% of NGV):
${JSON.stringify(sensorCompact())}

INGESTED DOCUMENTS (Couchbase RAG pipeline):
${JSON.stringify(logSummary())}

INSTRUCTIONS: Be precise, cite data fields/campaigns. Bold key values. Use bullet lists. Max 350 words unless detailed analysis requested.`;
}

// ── Build messages array (Groq / OpenAI format) ───────────────
function buildMessages(userMessage, history = []) {
  return [
    { role: 'system', content: buildSystemPrompt() },
    ...history,
    { role: 'user', content: userMessage },
  ];
}

// ── Shared request headers ────────────────────────────────────
function groqHeaders() {
  return {
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Type': 'application/json',
  };
}

// ── Non-streaming fetch ───────────────────────────────────────
export async function askSafetyAI(userMessage, history = []) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: groqHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      messages: buildMessages(userMessage, history),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Groq error ' + res.status + ': ' + err);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '(no response)';
}

// ── Streaming fetch ───────────────────────────────────────────
export async function askSafetyAIStream(userMessage, history = [], onChunk, onDone, onError) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: groqHeaders(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.2,
        stream: true,
        messages: buildMessages(userMessage, history),
      }),
    });
  } catch (e) {
    onError && onError(e.message);
    return;
  }

  if (!res.ok) {
    const err = await res.text();
    onError && onError('Groq ' + res.status + ': ' + err);
    return;
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
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

// ── Semantic search ───────────────────────────────────────────
export async function semanticSearch(query) {
  const prompt = `Search the safety database for: "${query}"
Return exactly 5 results as a JSON array only (no other text):
[{"score":0.00,"chunk":"...","source":"file.csv","docType":"category"}]
Scores descending (0–1 cosine similarity).`;

  const raw = await askSafetyAI(prompt);
  try {
    const match = raw.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

// ── Proactive Safety Recommendations ─────────────────────────
export async function getRecommendations() {
  // Use real field names from mockSensors (pct, not ngvPct)
  const highSensors = mockSensors
    .filter(s => s.pct > 60)
    .map(s => ({ id: s.id, area: s.area, type: s.type, pct: s.pct, status: s.status }));

  const elevatedEmployees = mockEmployees
    .filter(e => e.pct > 50 || (e.bloodCadmium / e.cdLimit) * 100 > 50)
    .map(e => ({
      id: e.id, role: e.role, zone: e.zone,
      bpbPct: e.pct.toFixed(1),
      bcdPct: ((e.bloodCadmium / e.cdLimit) * 100).toFixed(1),
    }));

  const highRisk = riskMatrixData
    .filter(r => r.score >= 6)
    .map(r => ({ area: r.area, substance: r.substance, score: r.score }));

  const prompt = `Generate exactly 3 proactive safety recommendations for Stena Recycling NF based on these anomalies.

HIGH SENSORS (pct>60): ${JSON.stringify(highSensors)}
ELEVATED BIOMONITORING (>50% of limit): ${JSON.stringify(elevatedEmployees)}
HIGH RISK ITEMS (score>=6): ${JSON.stringify(highRisk)}

Return ONLY a valid JSON array, no markdown, no explanation:
[{"title":"max 8 words","description":"1-2 sentences on issue and action","priority":"High|Medium|Low","source_reference":"AFS/ICSC/study citation"}]`;

  const raw = await askSafetyAI(prompt);
  try {
    const match = raw.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}
