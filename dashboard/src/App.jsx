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

export default function App() {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Header />
        <main style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, flex:1 }}>
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
          <div style={{ paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--text-muted)' }}>
            <span>Stena Recycling NF · Chemical Workplace Risk Assessment · AI Exposure Safety Analytics POC</span>
            <span>AFS 2020:6 Compliant · Last revised 2026-05-28 · Next measurement Feb 2027</span>
          </div>
        </main>
      </div>
    </div>
  );
}
