import { useState } from 'react';
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

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const { title, sub } = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-base)' }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Header pageTitle={title} pageSub={sub} />
        <main style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, flex:1 }}>

          {activePage === 'overview' && (
            <>
              <KPICards />
              <div style={{ display:'flex', gap:20, alignItems:'stretch' }}>
                <div style={{ flex:1, minWidth:0 }}><ExposureTrendChart /></div>
                <div style={{ width:280, flexShrink:0 }}><ComplianceDonut /></div>
              </div>
              <div style={{ display:'flex', gap:20, alignItems:'stretch' }}>
                <div style={{ flex:1, minWidth:0 }}><AreaExposureChart /></div>
                <div style={{ width:340, flexShrink:0 }}><GasMonitorCard /></div>
              </div>
              <RiskMatrix />
              <div style={{ display:'flex', gap:20, alignItems:'stretch' }}>
                <div style={{ flex:1, minWidth:0 }}><BloodLeadChart /></div>
                <div style={{ flex:1, minWidth:0 }}><MetalsTable /></div>
              </div>
              <RecentMeasurements />
              <RecommendationsCard />
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

      {/* Global floating chat widget — available on all pages */}
      <ChatWidget />
    </div>
  );
}
