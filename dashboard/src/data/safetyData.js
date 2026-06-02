export const facility = {
  name: "Stena Recycling NF",
  location: "Halmstad, Sweden",
  lastAssessment: "2026-05-28",
  lastMeasurement: "2026-03-11",
  ventilationCapacity: "128,885 l/s",
  areas: 12,
};

export const exposureTrendData = [
  { date: "May 2020", dust_inhalable: 143, dust_respirable: 28, no2: 5.1, hydrocarbons: 0.15, metals_lead: 52, metals_copper: 88, campaign: "200513" },
  { date: "Nov 2020", dust_inhalable: 87,  dust_respirable: 18, no2: 2.6, hydrocarbons: 0.20, metals_lead: 47, metals_copper: 71, campaign: "201112" },
  { date: "Jun 2021", dust_inhalable: 42,  dust_respirable: 8,  no2: 3.75,hydrocarbons: 0.12, metals_lead: 38, metals_copper: 55, campaign: "210603" },
  { date: "Mar 2022", dust_inhalable: 31,  dust_respirable: 6,  no2: 4.44,hydrocarbons: 6.4,  metals_lead: 33, metals_copper: 41, campaign: "220310" },
  { date: "Feb 2023", dust_inhalable: 22,  dust_respirable: 4,  no2: 3.68,hydrocarbons: 5.4,  metals_lead: 29, metals_copper: 36, campaign: "230223" },
  { date: "Feb 2024", dust_inhalable: 18,  dust_respirable: 3.5,no2: 4.13,hydrocarbons: 3.07, metals_lead: 24, metals_copper: 31, campaign: "240229" },
  { date: "Jan 2025", dust_inhalable: 15,  dust_respirable: 3,  no2: 3.91,hydrocarbons: 3.0,  metals_lead: 21, metals_copper: 28, campaign: "250122" },
  { date: "Mar 2026", dust_inhalable: 12,  dust_respirable: 2.8,no2: 3.61,hydrocarbons: 3.4,  metals_lead: 18, metals_copper: 24, campaign: "260311" },
];

export const latestExposureByArea = [
  { area: "XRF Plockhytt 1", dust: 8,  metals: 22, no2: 3.2, hydrocarbons: 2.1, riskScore: 1 },
  { area: "XRF Plockhytt 2", dust: 9,  metals: 25, no2: 3.4, hydrocarbons: 2.3, riskScore: 1 },
  { area: "Flotation 2.2",   dust: 21, metals: 41, no2: 3.8, hydrocarbons: 2.8, riskScore: 3 },
  { area: "Flotation 3.2",   dust: 18, metals: 36, no2: 3.6, hydrocarbons: 3.6, riskScore: 3 },
  { area: "Finesline / SGM", dust: 15, metals: 31, no2: 3.1, hydrocarbons: 2.4, riskScore: 2 },
  { area: "Water Treatment", dust: 6,  metals: 12, no2: 3.2, hydrocarbons: 3.2, riskScore: 1 },
  { area: "Dry Sep / IWT",   dust: 12, metals: 28, no2: 4.2, hydrocarbons: 2.8, riskScore: 2 },
  { area: "Sensor / Gula",   dust: 39, metals: 58, no2: 3.6, hydrocarbons: 3.1, riskScore: 6 },
  { area: "Ficka 55 / Rygg", dust: 22, metals: 44, no2: 3.0, hydrocarbons: 2.2, riskScore: 3 },
  { area: "Catwalk / Balkong",dust: 11,metals: 19, no2: 2.8, hydrocarbons: 1.9, riskScore: 1 },
  { area: "Hjullastare",     dust: 4,  metals: 8,  no2: 2.1, hydrocarbons: 1.4, riskScore: 1 },
  { area: "Styrhytt",        dust: 5,  metals: 10, no2: 2.5, hydrocarbons: 1.8, riskScore: 1 },
];

export const metalsMeasurements = [
  { metal: "Lead (Pb)",     symbol: "Pb", latestPct: 18, avgPct: 31, campaigns: 8, status: "warning", ngv: "0.05 mg/m³" },
  { metal: "Iron (Fe)",     symbol: "Fe", latestPct: 24, avgPct: 42, campaigns: 8, status: "safe",    ngv: "3.5 mg/m³" },
  { metal: "Copper (Cu)",   symbol: "Cu", latestPct: 24, avgPct: 52, campaigns: 8, status: "warning", ngv: "0.01 mg/m³" },
  { metal: "Manganese (Mn)",symbol: "Mn", latestPct: 12, avgPct: 28, campaigns: 8, status: "safe",    ngv: "0.2 mg/m³" },
  { metal: "Arsenic (As)",  symbol: "As", latestPct: 6,  avgPct: 14, campaigns: 8, status: "safe",    ngv: "0.01 mg/m³" },
  { metal: "Chromium (Cr)", symbol: "Cr", latestPct: 4,  avgPct: 9,  campaigns: 8, status: "safe",    ngv: "0.5 mg/m³" },
  { metal: "Nickel (Ni)",   symbol: "Ni", latestPct: 3,  avgPct: 7,  campaigns: 8, status: "safe",    ngv: "0.5 mg/m³" },
  { metal: "Cadmium (Cd)",  symbol: "Cd", latestPct: 2,  avgPct: 4,  campaigns: 8, status: "safe",    ngv: "0.004 mg/m³" },
  { metal: "Cobalt (Co)",   symbol: "Co", latestPct: 1,  avgPct: 3,  campaigns: 8, status: "safe",    ngv: "0.02 mg/m³" },
  { metal: "Beryllium (Be)",symbol: "Be", latestPct: 4,  avgPct: 4,  campaigns: 8, status: "safe",    ngv: "0.0006 mg/m³" },
];

export const riskMatrixData = [
  { area: "Sensor",        hazard: "Inorganic Dust (I)",  probability: 2, consequence: 3, score: 6, trend: "stable",   lastAction: "Mask requirement enforced" },
  { area: "Sensor",        hazard: "Lead Dust (Pb)",       probability: 2, consequence: 3, score: 6, trend: "improving",lastAction: "P3 filter masks mandatory" },
  { area: "Flotation 3.2", hazard: "Inorganic Dust (I)",  probability: 2, consequence: 3, score: 6, trend: "improving",lastAction: "Process ventilation installed" },
  { area: "Flotation 2.2", hazard: "Inorganic Dust (I)",  probability: 2, consequence: 3, score: 6, trend: "improving",lastAction: "Ventilation upgrade 2023" },
  { area: "Finesline",     hazard: "Metal Dust",           probability: 2, consequence: 2, score: 4, trend: "improving",lastAction: "Dust suppression increased" },
  { area: "Ficka 55",      hazard: "Inorganic Dust (I)",  probability: 2, consequence: 2, score: 4, trend: "improving",lastAction: "Ventilation upgrade" },
  { area: "All Areas",     hazard: "Diesel Exhaust (HC)", probability: 1, consequence: 1, score: 1, trend: "stable",   lastAction: "Monitoring continues" },
  { area: "All Areas",     hazard: "Nitrogen Dioxide",    probability: 1, consequence: 1, score: 1, trend: "stable",   lastAction: "Monitoring continues" },
  { area: "XRF Plockhytt",hazard: "Inorganic Dust (R)",  probability: 1, consequence: 1, score: 1, trend: "stable",   lastAction: "Mask requirement" },
  { area: "Water Treat.",  hazard: "Hydrocarbons",         probability: 1, consequence: 1, score: 1, trend: "stable",   lastAction: "Monitoring continues" },
  { area: "Dry Sep / IWT", hazard: "Lead Dust (Pb)",      probability: 1, consequence: 2, score: 2, trend: "improving",lastAction: "PPE enforcement" },
  { area: "Hjullastare",   hazard: "Inorganic Dust (I)",  probability: 1, consequence: 1, score: 1, trend: "stable",   lastAction: "No action required" },
];

export const bloodLeadData = [
  { period: "Q1 2022", men: 0.52,  women: 0.41,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q2 2022", men: 0.50,  women: 0.39,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q3 2022", men: 0.49,  women: 0.38,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q4 2022", men: 0.48,  women: 0.37,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q1 2023", men: 0.51,  women: 0.52,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q2 2023", men: 0.50,  women: 0.54,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q3 2023", men: 0.49,  women: 0.51,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q4 2023", men: 0.48,  women: 0.48,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q1 2024", men: 0.50,  women: 0.52,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q2 2024", men: 0.49,  women: 0.50,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q3 2024", men: 0.48,  women: 0.46,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q4 2024", men: 0.47,  women: 0.42,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q1 2025", men: 0.48,  women: 0.38,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q2 2025", men: 0.47,  women: 0.36,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q3 2025", men: 0.475, women: 0.34,  menLimit: 1.5, womenLimit: 0.5 },
  { period: "Q4 2025", men: 0.474, women: 0.336, menLimit: 1.5, womenLimit: 0.5 },
];

export const complianceDonutData = [
  { name: "Safe (<20%)",        value: 68, color: "#10b981" },
  { name: "Low Risk (20–50%)",  value: 18, color: "#f59e0b" },
  { name: "Med (50–100%)",      value: 10, color: "#f97316" },
  { name: "Exceeded (>100%)",   value: 4,  color: "#ef4444" },
];

export const recentMeasurements = [
  { date: "2026-03-11", area: "Flotation 3.2",        substance: "Hydrocarbons",   value: "0.002 mg/m³", pct: 3.6,  status: "safe",     type: "personburen" },
  { date: "2026-03-11", area: "Flotation 1.4",        substance: "Hydrocarbons",   value: "0.002 mg/m³", pct: 3.2,  status: "safe",     type: "personburen" },
  { date: "2025-01-22", area: "Water Treatment",      substance: "NO₂",            value: "0.040 mg/m³", pct: 4.17, status: "safe",     type: "stationär" },
  { date: "2025-01-22", area: "Flotation 3.2",        substance: "NO₂",            value: "0.040 mg/m³", pct: 3.65, status: "safe",     type: "personburen" },
  { date: "2025-01-22", area: "Flotation 1.4",        substance: "Hydrocarbons",   value: "0.001 mg/m³", pct: 2.8,  status: "safe",     type: "personburen" },
  { date: "2024-02-29", area: "Flotation 1.4",        substance: "Hydrocarbons",   value: "0.002 mg/m³", pct: 3.8,  status: "safe",     type: "personburen" },
  { date: "2024-02-29", area: "Water Treatment",      substance: "NO₂",            value: "0.037 mg/m³", pct: 3.85, status: "safe",     type: "stationär" },
  { date: "2023-02-23", area: "Flotation 3.2",        substance: "Hydrocarbons",   value: "0.005 mg/m³", pct: 9.8,  status: "safe",     type: "personburen" },
  { date: "2022-03-10", area: "Flotation 3.2",        substance: "Hydrocarbons",   value: "0.006 mg/m³", pct: 11.2, status: "safe",     type: "personburen" },
  { date: "2021-06-03", area: "2.2 / 3.2 SGM",        substance: "Inorg. Dust (R)", value: "0.150 mg/m³", pct: 6.0,  status: "safe",     type: "personburen" },
  { date: "2020-11-12", area: "2.2 / 3.2 SGM",        substance: "Inorg. Dust (I)", value: "12.14 mg/m³", pct: 243,  status: "critical",  type: "personburen" },
  { date: "2020-05-13", area: "Ficka 55",              substance: "Inorg. Dust (I)", value: "9.970 mg/m³", pct: 199,  status: "critical",  type: "stationär" },
  { date: "2020-05-13", area: "Flotation 2.2",         substance: "Inorg. Dust (I)", value: "3.040 mg/m³", pct: 61,   status: "warning",   type: "personburen" },
  { date: "2020-05-13", area: "Sensor / Gula hörnan",  substance: "Inorg. Dust (I)", value: "21.71 mg/m³", pct: 434,  status: "critical",  type: "personburen" },
];
