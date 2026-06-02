# AI Exposure Safety Analytics POC

A comprehensive chemical workplace exposure monitoring and risk assessment dashboard for **Stena Recycling NF**, built with React, Vite, and Couchbase Capella.

## Overview

This project provides real-time monitoring and analytics for chemical exposure risks in the workplace, tracking measurements of inorganic dust, metals (lead, copper, etc.), nitrogen dioxide, and hydrocarbons across 12 facility areas.

**Facility:** Stena Recycling NF, Halmstad, Sweden  
**Compliance Standard:** AFS 2020:6 (Swedish workplace exposure limits)  
**Last Assessment:** 2026-05-28  

---

## Features

### 📊 Dashboard Pages

1. **Safety Overview** - Main dashboard with KPIs, exposure trends, and compliance metrics
2. **Database Schema** - Couchbase Capella structure documentation
3. **Employees** - Employee records and exposure history (12 active records)
4. **IoT Sensors** - Real-time telemetry from monitoring sensors
5. **IoT Time-Series** - 24-hour window of sensor measurements
6. **RAG Pipeline** - Document ingestion logs and embeddings for AI analysis

### 📈 Key Visualizations

- **KPI Cards** - Quick compliance and exposure metrics
- **Exposure Trend Chart** - Historical exposure data (2020-2026)
- **Area Exposure Chart** - Exposure levels across 12 facility areas
- **Compliance Donut** - Regulatory compliance status
- **Blood Lead Chart** - Lead exposure tracking
- **Metals Table** - Detailed metal measurements with NGV limits
- **Risk Matrix** - Hazard probability vs. consequence matrix
- **Recent Measurements** - Latest measurement logs
- **Gas Monitor Card** - Real-time gas monitoring

### 📐 Monitored Substances

| Substance | Type | NGV Limit |
|-----------|------|-----------|
| Lead (Pb) | Metal | 0.05 mg/m³ |
| Iron (Fe) | Metal | 3.5 mg/m³ |
| Copper (Cu) | Metal | 0.01 mg/m³ |
| Inorganic Dust | Particulate | 5 mg/m³ |
| NO₂ | Gas | 1.9 mg/m³ |
| Hydrocarbons | Gas | Variable |

---

## Tech Stack

- **Frontend:** React 18.3 + Vite 5.4
- **UI Components:** Recharts (charts), Lucide React (icons)
- **Database:** Couchbase Capella
- **Data Format:** CSV measurements with structured schema
- **Styling:** CSS variables with custom theme

---

## Project Structure

```
dashboard/
├── public/              # Static assets
├── src/
│   ├── components/
│   │   ├── pages/       # Multi-page views (DatabaseSchemaPage, etc.)
│   │   ├── KPICards.jsx
│   │   ├── ExposureTrendChart.jsx
│   │   ├── RiskMatrix.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...          # Other visualization components
│   ├── data/
│   │   ├── safetyData.js       # Measurement data and facility info
│   │   └── couchbaseSchema.js  # Database schema documentation
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── vite.config.js
├── package.json
└── README.md
```

---

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. **Navigate to dashboard directory:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Access the dashboard at `http://localhost:5173`

---

## Available Scripts

```bash
npm run dev      # Start Vite development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint code quality checks
```

---

## Data Management

### CSV Files
- **Location:** `Riskbedömning Kemiska Arbetsmiljörisker 2026.05.28_NF-*/`
- **Count:** 66 measurement files
- **Status:** Stored locally, NOT tracked in git
- **Purpose:** Will be loaded from Couchbase database in production

### Database Schema (Couchbase Capella)
- **Bucket:** `chemsafe`
- **Scopes:** `safety_ops`
- **Collections:**
  - `employees` - Employee records with exposure history
  - `sensors` - IoT sensor metadata and location
  - `sensor_measurements` - Time-series measurement data
  - `ingestion_logs` - Document ingestion records
  - `document_embeddings` - RAG embeddings for AI analysis

---

## Facility Areas Monitored (12 locations)

1. XRF Plockhytt 1
2. XRF Plockhytt 2
3. Flotation 2.2
4. Flotation 3.2
5. Finesline / SGM
6. Water Treatment
7. Dry Sep / IWT
8. Sensor / Gula
9. Ficka 55 / Rygg
10. Catwalk / Balkong
11. Hjullastare
12. Styrhytt

---

## Key Metrics

- **Ventilation Capacity:** 128,885 l/s
- **Assessment Frequency:** Annual (next: Feb 2027)
- **Measurement Campaigns:** 8 historical (May 2020 - Mar 2026)
- **Current Trend:** Exposure levels declining since 2020

---

## Compliance

✅ **AFS 2020:6 Compliant** - Swedish occupational exposure limits  
✅ **Real-time Monitoring** - Continuous IoT sensor data  
✅ **Historical Tracking** - 6-year exposure trend analysis  
✅ **Risk Assessment** - Probability × Consequence matrix  

---

## Environment Variables

Create a `.env` file (not tracked in git):
```
VITE_COUCHBASE_URL=your_couchbase_url
VITE_API_KEY=your_api_key
```

---

## Contributing

1. Create a feature branch
2. Commit changes with clear messages
3. Push to GitHub
4. Create a pull request

---

## License

Internal use only - Stena Recycling NF

---

## Contact

**Project:** AI Exposure Safety Analytics POC  
**Organization:** Stena Recycling NF  
**Last Updated:** June 2, 2026  

For questions or issues, contact the development team.
