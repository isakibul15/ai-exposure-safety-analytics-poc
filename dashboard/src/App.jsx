import { useState, useEffect, useRef } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPICards from './components/KPICards';
import ExposureTrendChart from './components/ExposureTrendChart';
import ComplianceDonut from './components/ComplianceDonut';
import AreaExposureChart from './components/AreaExposureChart';
import BloodLeadChart from './components/BloodLeadChart';
import MetalsTable from './components/MetalsTable';
import RiskMatrix from './components/RiskMatrix';
import RecentMeasurements from './components/RecentMeasurements';
import GasMonitorCard from './components/GasMonitorCard';
import ChatWidget from './components/ChatWidget';
import RecommendationsCard from './components/RecommendationsCard';
import MemoryGraphCard from './components/MemoryGraphCard';

import DatabaseSchemaPage from './components/pages/DatabaseSchemaPage';
import EmployeesPage from './components/pages/EmployeesPage';
import SensorsPage from './components/pages/SensorsPage';
import IoTDashboardPage from './components/pages/IoTDashboardPage';
import RAGPipelinePage from './components/pages/RAGPipelinePage';

const PAGE_TITLES = {
  overview:  { title: 'Safety Overview',   sub: 'Stena Recycling NF · Campaign 260311 · AFS 2020:6' },
  schema:    { title: 'Database Schema',   sub: 'Couchbase Capella · Bucket: chemsafe · Scope: safety_ops' },
  employees: { title: 'Employees',         sub: 'chemsafe.safety_ops.employees · 12 active records' },
  sensors:   { title: 'IoT Sensors',       sub: 'chemsafe.safety_ops.sensors · Real-time telemetry' },
  iot:       { title: 'IoT Time-Series',   sub: 'chemsafe.safety_ops.sensor_measurements · 24h window' },
  rag:       { title: 'RAG Pipeline',      sub: 'chemsafe.safety_ops.ingestion_logs + document_embeddings' },
};

// Maps each Safety Dashboard navId → the section id to scroll to on the overview page
const SECTION_MAP = {
  overview:          'sec-overview',
  exposure_trends:   'sec-exposure',
  chemical_analysis: 'sec-chemical',
  risk_matrix:       'sec-risk',
  bio_monitoring:    'sec-bio',
  measurements:      'sec-measurements',
  compliance:        'sec-compliance',
  actions_ppe:       'sec-ppe',
};

function scrollTo(sectionId) {
  // Small delay so if the page was just switched the DOM is ready
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}

export default function App() {
  const [activePage,  setActivePage]  = useState('overview');
  const [activeNavId, setActiveNavId] = useState('overview');
  const [dateFrom,    setDateFrom]    = useState(2020);
  const [dateTo,      setDateTo]      = useState(2026);

  // Suppress scrollspy briefly after a sidebar click so the highlight
  // doesn't flicker through intermediate sections during smooth scroll
  const suppressRef = useRef(false);

  const { title, sub } = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  // ── Scrollspy: update active nav as user scrolls ──────────────
  useEffect(() => {
    if (activePage !== 'overview') return;

    // Ordered list so we can walk top-to-bottom
    const entries = Object.entries(SECTION_MAP);

    function onScroll() {
      if (suppressRef.current) return;

      // 120 px offset accounts for the sticky header + some breathing room
      const TRIGGER = 120;
      let current = entries[0][0]; // fallback to first nav item

      for (const [navId, secId] of entries) {
        const el = document.getElementById(secId);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= TRIGGER) {
          current = navId;
        }
      }

      setActiveNavId(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // sync on mount / page switch

    return () => window.removeEventListener('scroll', onScroll);
  }, [activePage]);

  function handleNavigate(page, navId) {
    setActivePage(page);
    setActiveNavId(navId);

    if (page === 'overview' && SECTION_MAP[navId]) {
      // Suppress scrollspy for ~800 ms so the chosen item stays highlighted
      // during the smooth-scroll animation
      suppressRef.current = true;
      setTimeout(() => { suppressRef.current = false; }, 800);
      scrollTo(SECTION_MAP[navId]);
    }
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-base)' }}>
      <Sidebar activeNavId={activeNavId} onNavigate={handleNavigate} />
      <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Header
          pageTitle={title}
          pageSub={sub}
          onNavigate={handleNavigate}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
        />
        <main style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, flex:1 }}>

          {activePage === 'overview' && (
            <>
              {/* ── KPI / Overview ───────────────────────────────── */}
              <section id="sec-overview">
                <KPICards />
              </section>

              {/* ── Exposure Trends + Compliance ─────────────────── */}
              <section id="sec-exposure" style={{ display:'flex', gap:20, alignItems:'stretch' }}>
                <div style={{ flex:1, minWidth:0 }}><ExposureTrendChart dateFrom={dateFrom} dateTo={dateTo} /></div>
                <div id="sec-compliance" style={{ width:280, flexShrink:0 }}><ComplianceDonut /></div>
              </section>

              {/* ── Chemical Analysis + Actions & PPE ────────────── */}
              <section id="sec-chemical" style={{ display:'flex', gap:20, alignItems:'stretch' }}>
                <div style={{ flex:1, minWidth:0 }}><AreaExposureChart /></div>
                <div id="sec-ppe" style={{ width:340, flexShrink:0 }}><GasMonitorCard /></div>
              </section>

              {/* ── Risk Matrix ───────────────────────────────────── */}
              <section id="sec-risk">
                <RiskMatrix />
              </section>

              {/* ── Bio. Monitoring + Metals ─────────────────────── */}
              <section id="sec-bio" style={{ display:'flex', gap:20, alignItems:'stretch', height:460 }}>
                <div style={{ flex:1, minWidth:0 }}><BloodLeadChart dateFrom={dateFrom} dateTo={dateTo} /></div>
                <div style={{ flex:1, minWidth:0 }}><MetalsTable /></div>
              </section>

              {/* ── Recent Measurements ───────────────────────────── */}
              <section id="sec-measurements">
                <RecentMeasurements />
              </section>

              <RecommendationsCard />
              <MemoryGraphCard />
            </>
          )}

          {activePage === 'schema'    && <DatabaseSchemaPage />}
          {activePage === 'employees' && <EmployeesPage />}
          {activePage === 'sensors'   && <SensorsPage />}
          {activePage === 'iot'       && <IoTDashboardPage />}
          {activePage === 'rag'       && <RAGPipelinePage />}

          <div style={{ paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--text-muted)' }}>
            <span>Stena Recycling NF · Chemical Workplace Risk Assessment · AI Exposure Safety Analytics POC</span>
            <span>AFS 2020:6 Compliant · Last revised 2026-05-28 · Next measurement Feb 2027</span>
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
