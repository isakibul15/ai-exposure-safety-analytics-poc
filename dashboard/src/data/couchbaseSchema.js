// ============================================================
// Couchbase chemsafe – IoT Safety System Schema
// Bucket: chemsafe | Scope: safety_ops
// Server: Couchbase Capella / Server 7.6+
// ============================================================

// ── N1QL: Global Setup ────────────────────────────────────────
export const n1qlSetup = `-- ① Create scope
CREATE SCOPE \`chemsafe\`.\`safety_ops\`;

-- ② Collections – Pillar 1: Core Entities
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`employees\`;
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`sensors\`;

-- ③ Collections – Pillar 2: IoT Time-Series
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`health_reports\`;
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`sensor_measurements\`;

-- ④ Collections – Pillar 3: AI RAG Pipeline
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`ingestion_logs\`;
CREATE COLLECTION \`chemsafe\`.\`safety_ops\`.\`document_embeddings\`;

-- ⑤ Primary indexes (dev only – use GSI in prod)
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`employees\`;
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`sensors\`;
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`health_reports\`;
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`sensor_measurements\`;
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`ingestion_logs\`;
CREATE PRIMARY INDEX ON \`chemsafe\`.\`safety_ops\`.\`document_embeddings\`;

-- ⑥ GSI indexes for high-throughput lookups
CREATE INDEX idx_emp_zone
  ON \`chemsafe\`.\`safety_ops\`.\`employees\`(zone, status);

CREATE INDEX idx_health_emp_date
  ON \`chemsafe\`.\`safety_ops\`.\`health_reports\`(employee_id, report_date DESC);

CREATE INDEX idx_meas_sensor_ts
  ON \`chemsafe\`.\`safety_ops\`.\`sensor_measurements\`(sensor_id, measured_at DESC);

CREATE INDEX idx_sensor_area
  ON \`chemsafe\`.\`safety_ops\`.\`sensors\`(area, type);

CREATE INDEX idx_ingest_status
  ON \`chemsafe\`.\`safety_ops\`.\`ingestion_logs\`(status, ingested_at DESC);`;

// ── N1QL: Sample JOIN – employees + health_reports ────────────
export const n1qlJoinQuery = `-- Latest blood-lead reading per active employee with risk flag
SELECT
  e.employee_id,
  e.full_name,
  e.zone,
  e.role,
  h.report_date,
  h.blood_lead_umol,
  h.blood_lead_umol / e.gender_limit AS pct_of_limit,
  CASE
    WHEN h.blood_lead_umol / e.gender_limit > 1.0  THEN "EXCEEDED"
    WHEN h.blood_lead_umol / e.gender_limit > 0.75 THEN "WARNING"
    ELSE                                                  "SAFE"
  END AS compliance_status
FROM \`chemsafe\`.\`safety_ops\`.\`employees\` e
JOIN \`chemsafe\`.\`safety_ops\`.\`health_reports\` h
  ON h.employee_id = e.employee_id
WHERE e.status = "active"
  AND h.report_date = (
    SELECT RAW MAX(h2.report_date)
    FROM \`chemsafe\`.\`safety_ops\`.\`health_reports\` h2
    WHERE h2.employee_id = e.employee_id
  )[0]
ORDER BY pct_of_limit DESC;`;

// ── N1QL: Sensor time-series window query ─────────────────────
export const n1qlTimeSeriesQuery = `-- 1-hour rolling average per sensor (last 24 h)
SELECT
  s.sensor_id,
  s.area,
  s.type,
  DATE_TRUNC_STR(m.measured_at, "hour") AS hour_bucket,
  AVG(m.value)   AS avg_value,
  MAX(m.value)   AS peak_value,
  m.unit,
  m.ngv_pct_avg  AS avg_ngv_pct
FROM \`chemsafe\`.\`safety_ops\`.\`sensors\` s
JOIN \`chemsafe\`.\`safety_ops\`.\`sensor_measurements\` m
  ON m.sensor_id = s.sensor_id
WHERE m.measured_at >= DATE_ADD_STR(NOW_STR(), -24, "hour")
GROUP BY s.sensor_id, s.area, s.type,
         DATE_TRUNC_STR(m.measured_at, "hour"),
         m.unit, m.ngv_pct_avg
ORDER BY s.sensor_id, hour_bucket;`;

// ── Vector Search Index Definition ───────────────────────────
export const vectorIndexDef = {
  name: "idx_doc_embeddings_v1",
  type: "fulltext-index",
  params: {
    doc_config: {
      docid_prefix_delim: "::",
      docid_regexp: "",
      mode: "scope.collection.type_field",
      type_field: "type"
    },
    mapping: {
      default_analyzer: "standard",
      default_datetime_parser: "dateTimeOptional",
      default_field: "_all",
      default_mapping: { dynamic: false, enabled: false },
      default_type: "_default",
      type_field: "_type",
      types: {
        "safety_ops.document_embeddings": {
          dynamic: false,
          enabled: true,
          properties: {
            embedding_vector: {
              enabled: true,
              fields: [{
                dims: 384,
                index: true,
                name: "embedding_vector",
                similarity: "dot_product",
                type: "vector",
                vector_index_optimized_for: "recall"
              }]
            },
            chunk_text: {
              enabled: true,
              fields: [{ index: true, name: "chunk_text", store: true, type: "text" }]
            },
            doc_type: {
              enabled: true,
              fields: [{ index: true, name: "doc_type", type: "text" }]
            },
            source_ref: {
              enabled: true,
              fields: [{ index: true, name: "source_ref", type: "text" }]
            }
          }
        }
      }
    },
    store: { indexType: "scorch", segmentVersion: 16 }
  },
  sourceType: "gocbcore",
  sourceName: "chemsafe",
  sourceParams: {},
  planParams: { maxPartitionsPerPIndex: 1024, numReplicas: 1 }
};

// ── Example Documents ─────────────────────────────────────────

export const exampleDocuments = {
  employees: [
    {
      _key: "emp::EMP-001",
      type: "employee",
      employee_id: "EMP-001",
      full_name: "Dennis Rimstedt",
      role: "Machine Operator",
      zone: "Sensor / Gula",
      department: "Production",
      status: "active",
      gender: "male",
      gender_limit: 1.5,
      hire_date: "2017-03-14",
      ppe_certified: true,
      ppe_type: ["P3 half-mask", "Safety goggles", "Gloves"],
      badge_id: "RFID-4421",
      supervisor_id: "EMP-010",
      emergency_contact: { name: "Anna Rimstedt", phone: "+46-70-123-4567" },
      last_medical: "2026-02-10",
      created_at: "2017-03-14T08:00:00Z",
      updated_at: "2026-02-10T09:15:00Z"
    },
    {
      _key: "emp::EMP-002",
      type: "employee",
      employee_id: "EMP-002",
      full_name: "Maja Lindqvist",
      role: "QC Technician",
      zone: "XRF Plockhytt 1",
      department: "Quality Control",
      status: "active",
      gender: "female",
      gender_limit: 0.5,
      hire_date: "2019-08-20",
      ppe_certified: true,
      ppe_type: ["P2 half-mask", "Lab coat", "Safety goggles"],
      badge_id: "RFID-3812",
      supervisor_id: "EMP-010",
      emergency_contact: { name: "Erik Lindqvist", phone: "+46-70-987-6543" },
      last_medical: "2026-01-15",
      created_at: "2019-08-20T08:00:00Z",
      updated_at: "2026-01-15T10:30:00Z"
    },
    {
      _key: "emp::EMP-003",
      type: "employee",
      employee_id: "EMP-003",
      full_name: "Michael Skoglund",
      role: "Flotation Engineer",
      zone: "Flotation 2.2",
      department: "Engineering",
      status: "active",
      gender: "male",
      gender_limit: 1.5,
      hire_date: "2015-05-01",
      ppe_certified: true,
      ppe_type: ["P3 full-face", "Chemical apron", "Boots"],
      badge_id: "RFID-2257",
      supervisor_id: "EMP-010",
      emergency_contact: { name: "Karin Skoglund", phone: "+46-70-456-7890" },
      last_medical: "2026-03-01",
      created_at: "2015-05-01T08:00:00Z",
      updated_at: "2026-03-01T11:00:00Z"
    }
  ],

  sensors: [
    {
      _key: "sensor::SENS-DUST-001",
      type: "sensor",
      sensor_id: "SENS-DUST-001",
      area: "Sensor / Gula",
      sensor_type: "dust_inhalable",
      manufacturer: "Grimm Aerosol",
      model: "EDM 180",
      serial_no: "GR-180-44219",
      unit: "mg/m³",
      ngv: 5.0,
      ngv_unit: "mg/m³",
      sample_interval_s: 60,
      status: "active",
      firmware: "v3.2.1",
      last_calibrated: "2026-01-10",
      next_calibration: "2026-07-10",
      location: { building: "Hall A", coordinates: { lat: 56.6745, lng: 12.8577, floor: 1 } },
      alert_thresholds: { warning: 2.5, critical: 5.0 },
      installed_at: "2021-06-01T00:00:00Z",
      updated_at: "2026-01-10T08:00:00Z"
    },
    {
      _key: "sensor::SENS-NO2-003",
      type: "sensor",
      sensor_id: "SENS-NO2-003",
      area: "Flotation 3.2",
      sensor_type: "no2",
      manufacturer: "Dräger",
      model: "X-am 8000",
      serial_no: "DR-8K-88921",
      unit: "ppm",
      ngv: 0.5,
      ngv_unit: "ppm",
      sample_interval_s: 30,
      status: "active",
      firmware: "v5.0.3",
      last_calibrated: "2026-02-15",
      next_calibration: "2026-08-15",
      location: { building: "Hall B", coordinates: { lat: 56.6748, lng: 12.8581, floor: 1 } },
      alert_thresholds: { warning: 0.25, critical: 0.5 },
      installed_at: "2020-11-01T00:00:00Z",
      updated_at: "2026-02-15T08:00:00Z"
    },
    {
      _key: "sensor::SENS-HC-007",
      type: "sensor",
      sensor_id: "SENS-HC-007",
      area: "Water Treatment",
      sensor_type: "hydrocarbons",
      manufacturer: "Ion Science",
      model: "Tiger Select",
      serial_no: "IS-TS-33401",
      unit: "mg/m³",
      ngv: 0.5,
      ngv_unit: "mg/m³",
      sample_interval_s: 60,
      status: "active",
      firmware: "v2.1.0",
      last_calibrated: "2026-01-20",
      next_calibration: "2026-07-20",
      location: { building: "Hall C", coordinates: { lat: 56.6742, lng: 12.8570, floor: 0 } },
      alert_thresholds: { warning: 0.25, critical: 0.5 },
      installed_at: "2022-03-15T00:00:00Z",
      updated_at: "2026-01-20T08:00:00Z"
    }
  ],

  health_reports: [
    {
      _key: "health::EMP-001::2026-02-10::blood_lead",
      type: "health_report",
      report_id: "HR-2026-0210-001",
      employee_id: "EMP-001",
      report_date: "2026-02-10",
      report_type: "blood_lead",
      blood_lead_umol: 0.47,
      gender_limit: 1.5,
      pct_of_limit: 31.3,
      compliance_status: "SAFE",
      sampled_by: "Occupational Health Nurse",
      lab_id: "KarolinskaLab-SE",
      lab_reference: "LAB-2026-0214-4421",
      notes: "Annual mandatory screening. No symptoms reported.",
      follow_up_required: false,
      created_at: "2026-02-14T10:00:00Z"
    },
    {
      _key: "health::EMP-002::2026-01-15::blood_lead",
      type: "health_report",
      report_id: "HR-2026-0115-002",
      employee_id: "EMP-002",
      report_date: "2026-01-15",
      report_type: "blood_lead",
      blood_lead_umol: 0.34,
      gender_limit: 0.5,
      pct_of_limit: 68.0,
      compliance_status: "WARNING",
      sampled_by: "Occupational Health Nurse",
      lab_id: "KarolinskaLab-SE",
      lab_reference: "LAB-2026-0118-3812",
      notes: "Elevated relative to gender limit. PPE audit recommended.",
      follow_up_required: true,
      follow_up_date: "2026-04-15",
      created_at: "2026-01-18T10:00:00Z"
    },
    {
      _key: "health::EMP-003::2026-03-01::blood_lead",
      type: "health_report",
      report_id: "HR-2026-0301-003",
      employee_id: "EMP-003",
      report_date: "2026-03-01",
      report_type: "blood_lead",
      blood_lead_umol: 0.51,
      gender_limit: 1.5,
      pct_of_limit: 34.0,
      compliance_status: "SAFE",
      sampled_by: "Occupational Health Nurse",
      lab_id: "KarolinskaLab-SE",
      lab_reference: "LAB-2026-0305-2257",
      notes: "Stable. Flotation 2.2 ventilation upgrade noted.",
      follow_up_required: false,
      created_at: "2026-03-05T10:00:00Z"
    }
  ],

  sensor_measurements: [
    {
      _key: "meas::SENS-DUST-001::2026-03-11T07:00:00Z",
      type: "sensor_measurement",
      measurement_id: "MEAS-20260311-070000-DUST001",
      sensor_id: "SENS-DUST-001",
      area: "Sensor / Gula",
      substance: "dust_inhalable",
      measured_at: "2026-03-11T07:00:00Z",
      value: 12.3,
      unit: "mg/m³",
      ngv: 5.0,
      ngv_pct: 246.0,
      alert_level: "CRITICAL",
      shift: "morning",
      operator_present: true,
      raw_signal_mv: 2841,
      quality_flag: "valid",
      aggregation: { type: "1min_avg", source_count: 60 }
    },
    {
      _key: "meas::SENS-NO2-003::2026-03-11T08:30:00Z",
      type: "sensor_measurement",
      measurement_id: "MEAS-20260311-083000-NO2003",
      sensor_id: "SENS-NO2-003",
      area: "Flotation 3.2",
      substance: "no2",
      measured_at: "2026-03-11T08:30:00Z",
      value: 0.018,
      unit: "ppm",
      ngv: 0.5,
      ngv_pct: 3.6,
      alert_level: "SAFE",
      shift: "morning",
      operator_present: true,
      raw_signal_mv: 218,
      quality_flag: "valid",
      aggregation: { type: "1min_avg", source_count: 30 }
    },
    {
      _key: "meas::SENS-HC-007::2026-03-11T09:15:00Z",
      type: "sensor_measurement",
      measurement_id: "MEAS-20260311-091500-HC007",
      sensor_id: "SENS-HC-007",
      area: "Water Treatment",
      substance: "hydrocarbons",
      measured_at: "2026-03-11T09:15:00Z",
      value: 0.016,
      unit: "mg/m³",
      ngv: 0.5,
      ngv_pct: 3.2,
      alert_level: "SAFE",
      shift: "morning",
      operator_present: false,
      raw_signal_mv: 104,
      quality_flag: "valid",
      aggregation: { type: "1min_avg", source_count: 60 }
    }
  ],

  ingestion_logs: [
    {
      _key: "ingest::LOG-2026-0528-001",
      type: "ingestion_log",
      log_id: "LOG-2026-0528-001",
      source_file: "chemsafe_risk_assessment_2026.pdf",
      source_type: "pdf",
      ingested_at: "2026-05-28T14:22:10Z",
      status: "completed",
      total_pages: 84,
      chunks_created: 312,
      embeddings_generated: 312,
      embedding_model: "all-MiniLM-L6-v2",
      embedding_dims: 384,
      processing_ms: 8430,
      error_count: 0,
      triggered_by: "admin::SYS-SCHEDULER",
      metadata: {
        language: "sv",
        doc_type: "risk_assessment",
        facility: "Stena Recycling NF",
        period: "2026"
      }
    },
    {
      _key: "ingest::LOG-2026-0311-002",
      type: "ingestion_log",
      log_id: "LOG-2026-0311-002",
      source_file: "measurement_campaign_260311.xlsx",
      source_type: "excel",
      ingested_at: "2026-03-11T18:05:44Z",
      status: "completed",
      total_pages: null,
      chunks_created: 47,
      embeddings_generated: 47,
      embedding_model: "all-MiniLM-L6-v2",
      embedding_dims: 384,
      processing_ms: 1204,
      error_count: 0,
      triggered_by: "emp::EMP-010",
      metadata: {
        language: "sv",
        doc_type: "measurement_campaign",
        campaign_id: "260311",
        facility: "Stena Recycling NF"
      }
    },
    {
      _key: "ingest::LOG-2025-0122-003",
      type: "ingestion_log",
      log_id: "LOG-2025-0122-003",
      source_file: "measurement_campaign_250122.xlsx",
      source_type: "excel",
      ingested_at: "2025-01-22T17:40:11Z",
      status: "completed",
      total_pages: null,
      chunks_created: 38,
      embeddings_generated: 38,
      embedding_model: "all-MiniLM-L6-v2",
      embedding_dims: 384,
      processing_ms: 990,
      error_count: 0,
      triggered_by: "emp::EMP-010",
      metadata: {
        language: "sv",
        doc_type: "measurement_campaign",
        campaign_id: "250122",
        facility: "Stena Recycling NF"
      }
    }
  ],

  document_embeddings: [
    {
      _key: "emb::LOG-2026-0528-001::0001",
      type: "document_embedding",
      embedding_id: "EMB-2026-0528-0001",
      source_log_id: "LOG-2026-0528-001",
      source_file: "chemsafe_risk_assessment_2026.pdf",
      doc_type: "risk_assessment",
      source_ref: "chemsafe_risk_assessment_2026.pdf#page=12",
      chunk_index: 1,
      chunk_text: "Sensor / Gula hörnan: Inorganic dust (inhalable) measured at 39 mg/m³ against NGV of 5 mg/m³. Risk score 6 (P=2, C=3). P3 filter masks mandatory. Ventilation audit scheduled Q2 2026.",
      embedding_vector: Array.from({ length: 384 }, () => parseFloat((Math.random() * 0.2 - 0.1).toFixed(6))),
      token_count: 42,
      created_at: "2026-05-28T14:22:18Z",
      metadata: {
        area: "Sensor / Gula",
        substance: "dust_inhalable",
        campaign: "260311",
        language: "sv"
      }
    },
    {
      _key: "emb::LOG-2026-0528-001::0002",
      type: "document_embedding",
      embedding_id: "EMB-2026-0528-0002",
      source_log_id: "LOG-2026-0528-001",
      source_file: "chemsafe_risk_assessment_2026.pdf",
      doc_type: "risk_assessment",
      source_ref: "chemsafe_risk_assessment_2026.pdf#page=28",
      chunk_index: 2,
      chunk_text: "Blood lead monitoring 2025 Q4: Male employees average 0.474 µmol/L (31.6% of 1.5 µmol/L limit). Female employees average 0.336 µmol/L (67.2% of 0.5 µmol/L limit). No exceedances recorded.",
      embedding_vector: Array.from({ length: 384 }, () => parseFloat((Math.random() * 0.2 - 0.1).toFixed(6))),
      token_count: 38,
      created_at: "2026-05-28T14:22:19Z",
      metadata: {
        substance: "blood_lead",
        period: "2025-Q4",
        language: "sv"
      }
    }
  ]
};

// ── Mock Employees (extended for table view) ──────────────────
// bloodLead: µmol/L  |  limit (gender): µmol/L
// bloodCadmium: nmol/L  |  cdLimit: M=40, F=25 nmol/L  (AFS 2011:19)
export const mockEmployees = [
  { id: "EMP-001", role: "Machine Operator",    zone: "Sensor / Gula",     gender: "M", bloodLead: 0.47, limit: 1.5, pct: 31.3, badge: "RFID-4421", lastMedical: "2026-02-10", bloodCadmium: 8.2,  cdLimit: 40 },
  { id: "EMP-002", role: "QC Technician",       zone: "XRF Plockhytt 1",   gender: "F", bloodLead: 0.34, limit: 0.5, pct: 68.0, badge: "RFID-3812", lastMedical: "2026-01-15", bloodCadmium: 14.1, cdLimit: 25 },
  { id: "EMP-003", role: "Flotation Engineer",  zone: "Flotation 2.2",     gender: "M", bloodLead: 0.51, limit: 1.5, pct: 34.0, badge: "RFID-2257", lastMedical: "2026-03-01", bloodCadmium: 9.4,  cdLimit: 40 },
  { id: "EMP-004", role: "Env. Coordinator",    zone: "Finesline / SGM",   gender: "F", bloodLead: 0.29, limit: 0.5, pct: 58.0, badge: "RFID-5531", lastMedical: "2026-02-20", bloodCadmium: 11.3, cdLimit: 25 },
  { id: "EMP-005", role: "Sensor Technician",   zone: "Sensor / Gula",     gender: "M", bloodLead: 0.53, limit: 1.5, pct: 35.3, badge: "RFID-6640", lastMedical: "2026-02-12", bloodCadmium: 10.1, cdLimit: 40 },
  { id: "EMP-006", role: "Lab Analyst",         zone: "XRF Plockhytt 2",   gender: "F", bloodLead: 0.31, limit: 0.5, pct: 62.0, badge: "RFID-7712", lastMedical: "2026-01-20", bloodCadmium: 13.0, cdLimit: 25 },
  { id: "EMP-007", role: "Maintenance Tech",    zone: "Dry Sep / IWT",     gender: "M", bloodLead: 0.44, limit: 1.5, pct: 29.3, badge: "RFID-8823", lastMedical: "2026-03-05", bloodCadmium: 7.6,  cdLimit: 40 },
  { id: "EMP-008", role: "Water Treatment Op.", zone: "Water Treatment",   gender: "F", bloodLead: 0.22, limit: 0.5, pct: 44.0, badge: "RFID-9914", lastMedical: "2026-02-05", bloodCadmium: 6.4,  cdLimit: 25 },
  { id: "EMP-009", role: "Loader Operator",     zone: "Hjullastare",       gender: "M", bloodLead: 0.18, limit: 1.5, pct: 12.0, badge: "RFID-1025", lastMedical: "2026-01-28", bloodCadmium: 4.2,  cdLimit: 40 },
  { id: "EMP-010", role: "HSE Manager",         zone: "Styrhytt",          gender: "F", bloodLead: 0.12, limit: 0.5, pct: 24.0, badge: "RFID-1136", lastMedical: "2026-03-10", bloodCadmium: 3.8,  cdLimit: 25 },
  { id: "EMP-011", role: "Process Operator",    zone: "Flotation 3.2",     gender: "M", bloodLead: 0.49, limit: 1.5, pct: 32.7, badge: "RFID-1247", lastMedical: "2026-02-18", bloodCadmium: 8.9,  cdLimit: 40 },
  { id: "EMP-012", role: "Safety Inspector",    zone: "Catwalk / Balkong", gender: "F", bloodLead: 0.26, limit: 0.5, pct: 52.0, badge: "RFID-1358", lastMedical: "2025-12-10", bloodCadmium: 9.7,  cdLimit: 25 },
];

// ── Mock Sensors (extended for table view) ────────────────────
export const mockSensors = [
  { id: "SENS-DUST-001", area: "Sensor / Gula",     type: "dust_inhalable", value: 12.3,  ngv: 5.0,  pct: 246.0, status: "critical", lastCalibrated: "2026-01-10", model: "Grimm EDM 180" },
  { id: "SENS-DUST-002", area: "Flotation 2.2",     type: "dust_inhalable", value: 1.05,  ngv: 5.0,  pct: 21.0,  status: "warning",  lastCalibrated: "2026-01-10", model: "Grimm EDM 180" },
  { id: "SENS-DUST-003", area: "Flotation 3.2",     type: "dust_inhalable", value: 0.90,  ngv: 5.0,  pct: 18.0,  status: "safe",     lastCalibrated: "2026-01-10", model: "Grimm EDM 180" },
  { id: "SENS-DUST-004", area: "XRF Plockhytt 1",   type: "dust_respirable",value: 0.056, ngv: 2.5,  pct: 2.2,   status: "safe",     lastCalibrated: "2026-02-01", model: "TSI DustTrak" },
  { id: "SENS-NO2-001",  area: "Water Treatment",   type: "no2",            value: 0.020, ngv: 0.5,  pct: 4.0,   status: "safe",     lastCalibrated: "2026-02-15", model: "Dräger X-am 8000" },
  { id: "SENS-NO2-002",  area: "Dry Sep / IWT",     type: "no2",            value: 0.021, ngv: 0.5,  pct: 4.2,   status: "safe",     lastCalibrated: "2026-02-15", model: "Dräger X-am 8000" },
  { id: "SENS-NO2-003",  area: "Flotation 3.2",     type: "no2",            value: 0.018, ngv: 0.5,  pct: 3.6,   status: "safe",     lastCalibrated: "2026-02-15", model: "Dräger X-am 8000" },
  { id: "SENS-HC-001",   area: "Flotation 3.2",     type: "hydrocarbons",   value: 0.017, ngv: 0.5,  pct: 3.4,   status: "safe",     lastCalibrated: "2026-01-20", model: "Ion Science Tiger" },
  { id: "SENS-HC-002",   area: "Flotation 2.2",     type: "hydrocarbons",   value: 0.014, ngv: 0.5,  pct: 2.8,   status: "safe",     lastCalibrated: "2026-01-20", model: "Ion Science Tiger" },
  { id: "SENS-HC-003",   area: "Ficka 55 / Rygg",   type: "hydrocarbons",   value: 0.011, ngv: 0.5,  pct: 2.2,   status: "safe",     lastCalibrated: "2026-01-20", model: "Ion Science Tiger" },
  { id: "SENS-HC-007",   area: "Water Treatment",   type: "hydrocarbons",   value: 0.016, ngv: 0.5,  pct: 3.2,   status: "safe",     lastCalibrated: "2026-01-20", model: "Ion Science Tiger" },
  { id: "SENS-MET-001",  area: "Sensor / Gula",     type: "metals_lead",    value: 0.009, ngv: 0.05, pct: 18.0,  status: "safe",     lastCalibrated: "2026-03-01", model: "SKC AirChek XR5000" },
];

// ── Mock IoT time-series (24h sparkline per sensor) ──────────
export function generateTimeSeriesData(sensorId, baseNgvPct, hours = 24) {
  const now = new Date("2026-03-11T12:00:00Z");
  return Array.from({ length: hours }, (_, i) => {
    const ts = new Date(now - (hours - i) * 3600 * 1000);
    const noise = (Math.random() - 0.48) * 0.3 * baseNgvPct;
    const val = Math.max(0.1, baseNgvPct + noise);
    return {
      hour: ts.getHours().toString().padStart(2, "0") + ":00",
      ngv_pct: parseFloat(val.toFixed(1)),
    };
  });
}

// ── Database folder structure (maps to actual source files) ─────
export const DB_FOLDER_STRUCTURE = {
  root: "chemsafe_db/",
  folders: [
    {
      id: "risk_assessments",
      name: "risk_assessments/",
      label: "Risk Assessments (Area sheets)",
      color: "#7c6dfa",
      description: "Per-area chemical risk assessment sheets — NF codes correspond to work zone identifiers",
      files: [
        "NF-5001.csv","NF-5002.csv","NF-5003.csv","NF-5004.csv","NF-5005.csv",
        "NF-5006.csv","NF-5007.csv","NF-5008.csv","NF-5012.csv","NF-5013.csv",
        "NF-7430.csv","NF-7432.csv","NF-7433.csv","NF-7434.csv","NF-7435.csv",
        "NF-7436.csv","NF-7437.csv","NF-7439.csv","NF-7462.csv","NF-7463.csv",
        "NF-7464.csv","NF-7465.csv","NF-7466.csv","NF-7467.csv","NF-7468.csv",
        "NF-7492.csv","NF-7493.csv","NF-7494.csv","NF-7495.csv","NF-7496.csv",
      ],
    },
    {
      id: "measurement_campaigns",
      name: "measurement_campaigns/",
      label: "Compiled Measurement Campaigns",
      color: "#22d3ee",
      description: "All-area compiled campaign snapshots from 2020–2021",
      files: [
        "NF-Alla_200513.csv",
        "NF-Alla_201112.csv",
        "NF-Alla_210603.csv",
      ],
    },
    {
      id: "individual_measurements",
      name: "individual_measurements/",
      label: "Individual Sample Measurements (M-sheets)",
      color: "#f59e0b",
      description: "Individual measurement sample records — M-numbers are lab sample IDs",
      files: [
        "NF-M567.csv","NF-M581.csv","NF-M582.csv","NF-M584.csv","NF-M585.csv",
        "NF-M586.csv","NF-M587.csv","NF-M588.csv","NF-M589.csv","NF-M590.csv",
        "NF-M591.csv","NF-M593.csv","NF-M594.csv",
      ],
    },
    {
      id: "substance_analysis",
      name: "substance_analysis/",
      label: "Substance-Specific Measurement Logs",
      color: "#f97316",
      description: "Aggregated measurement logs per substance type across all campaigns",
      files: [
        "NF-Mätning_Kolväten.csv",
        "NF-Mätning_Kvävedioxid.csv",
        "NF-Mätning_Metaller_Damm.csv",
        "NF-Mätning_Oorganiskt_Damm.csv",
      ],
    },
    {
      id: "ventilation_data",
      name: "ventilation_data/",
      label: "Ventilation Measurements (tv-sheets)",
      color: "#10b981",
      description: "Ventilation capacity and airflow measurements per duct/zone",
      files: [
        "NF-tv132.csv","NF-tv145.csv","NF-tv146.csv","NF-tv149.csv",
        "NF-tv150.csv","NF-tv151.csv","NF-tv152.csv",
      ],
    },
    {
      id: "threshold_exceedances",
      name: "threshold_exceedances/",
      label: "Physical Threshold Exceedances (>20% NGV)",
      color: "#ef4444",
      description: "Filtered views showing only samples exceeding 20% of occupational limit",
      files: [
        "NF-Metaller_gt20pct_Fysiskt.csv",
        "NF-Oorganiskt_Damm_gt20pct_Fysiskt.csv",
      ],
    },
    {
      id: "risk_models",
      name: "risk_models/",
      label: "Risk Assessment Models & Zone Mapping",
      color: "#a78bfa",
      description: "Risk scoring models, zone definitions, and overall risk evaluation sheet",
      files: [
        "NF-Riskbedömning.csv",
        "NF-Riskbedömningsmodell.csv",
        "NF-Områdesindelning.csv",
      ],
    },
    {
      id: "reference_docs",
      name: "reference_docs/",
      label: "Reference & Supporting Documents",
      color: "#6b7a99",
      description: "Hygiene rules, table of contents, information sheets, and baseline data",
      files: [
        "NF-Blad1.csv",
        "NF-Hygienregler_NF.csv",
        "NF-Information.csv",
        "NF-Innehållsförteckning.csv",
      ],
    },
  ],
  rootFiles: [
    { name: "Sammanställning_Bly_NF.xlsx", type: "excel", label: "Biologisk exponeringskontroll Bly" },
  ],
};

// ── Mock RAG ingestion logs — all 67 source files ────────────
// NF prefix = "Riskbedömning Kemiska Arbetsmiljörisker 2026.05.28_NF-{sheet}"
// Generated from actual file listing of the source dataset
export const mockIngestionLogs = [
  // ── xlsx (root) ────────────────────────────────────────────────
  { id: "LOG-001", file: "Sammanställning_Bly_NF.xlsx",         type: "excel", category: "root",                   status: "completed", chunks: 48,  embeddings: 48,  ms: 1120,  date: "2026-05-29", triggeredBy: "Scheduler" },

  // ── Risk Assessments (NF area codes) ──────────────────────────
  { id: "LOG-002", file: "NF-5001.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 82,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-003", file: "NF-5002.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 88,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-004", file: "NF-5003.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 71,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-005", file: "NF-5004.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 79,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-006", file: "NF-5005.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 8,   embeddings: 8,   ms: 94,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-007", file: "NF-5006.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 68,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-008", file: "NF-5007.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 85,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-009", file: "NF-5008.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 77,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-010", file: "NF-5012.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 4,   embeddings: 4,   ms: 61,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-011", file: "NF-5013.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 69,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-012", file: "NF-7430.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 80,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-013", file: "NF-7432.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 86,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-014", file: "NF-7433.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 78,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-015", file: "NF-7434.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 8,   embeddings: 8,   ms: 97,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-016", file: "NF-7435.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 70,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-017", file: "NF-7436.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 81,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-018", file: "NF-7437.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 89,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-019", file: "NF-7439.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 72,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-020", file: "NF-7462.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 8,   embeddings: 8,   ms: 95,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-021", file: "NF-7463.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 80,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-022", file: "NF-7464.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 87,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-023", file: "NF-7465.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 68,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-024", file: "NF-7466.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 78,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-025", file: "NF-7467.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 90,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-026", file: "NF-7468.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 83,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-027", file: "NF-7492.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 71,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-028", file: "NF-7493.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 79,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-029", file: "NF-7494.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 7,   embeddings: 7,   ms: 88,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-030", file: "NF-7495.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 5,   embeddings: 5,   ms: 67,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-031", file: "NF-7496.csv",  type: "csv", category: "risk_assessments",      status: "completed", chunks: 6,   embeddings: 6,   ms: 77,    date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Measurement Campaigns ─────────────────────────────────────
  { id: "LOG-032", file: "NF-Alla_200513.csv", type: "csv", category: "measurement_campaigns", status: "completed", chunks: 28,  embeddings: 28,  ms: 310,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-033", file: "NF-Alla_201112.csv", type: "csv", category: "measurement_campaigns", status: "completed", chunks: 24,  embeddings: 24,  ms: 268,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-034", file: "NF-Alla_210603.csv", type: "csv", category: "measurement_campaigns", status: "completed", chunks: 21,  embeddings: 21,  ms: 241,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Individual Measurements ───────────────────────────────────
  { id: "LOG-035", file: "NF-M567.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 9,   embeddings: 9,   ms: 112,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-036", file: "NF-M581.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 11,  embeddings: 11,  ms: 134,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-037", file: "NF-M582.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 10,  embeddings: 10,  ms: 124,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-038", file: "NF-M584.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 8,   embeddings: 8,   ms: 102,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-039", file: "NF-M585.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 12,  embeddings: 12,  ms: 146,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-040", file: "NF-M586.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 9,   embeddings: 9,   ms: 113,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-041", file: "NF-M587.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 10,  embeddings: 10,  ms: 126,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-042", file: "NF-M588.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 11,  embeddings: 11,  ms: 137,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-043", file: "NF-M589.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 8,   embeddings: 8,   ms: 104,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-044", file: "NF-M590.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 9,   embeddings: 9,   ms: 115,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-045", file: "NF-M591.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 10,  embeddings: 10,  ms: 128,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-046", file: "NF-M593.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 7,   embeddings: 7,   ms: 93,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-047", file: "NF-M594.csv",  type: "csv", category: "individual_measurements", status: "completed", chunks: 8,   embeddings: 8,   ms: 105,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Substance Analysis ────────────────────────────────────────
  { id: "LOG-048", file: "NF-Mätning_Kolväten.csv",       type: "csv", category: "substance_analysis", status: "completed", chunks: 22,  embeddings: 22,  ms: 248,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-049", file: "NF-Mätning_Kvävedioxid.csv",    type: "csv", category: "substance_analysis", status: "completed", chunks: 19,  embeddings: 19,  ms: 213,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-050", file: "NF-Mätning_Metaller_Damm.csv",  type: "csv", category: "substance_analysis", status: "completed", chunks: 31,  embeddings: 31,  ms: 342,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-051", file: "NF-Mätning_Oorganiskt_Damm.csv",type: "csv", category: "substance_analysis", status: "completed", chunks: 26,  embeddings: 26,  ms: 289,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Ventilation Data ──────────────────────────────────────────
  { id: "LOG-052", file: "NF-tv132.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 14,  embeddings: 14,  ms: 162,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-053", file: "NF-tv145.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 16,  embeddings: 16,  ms: 184,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-054", file: "NF-tv146.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 15,  embeddings: 15,  ms: 173,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-055", file: "NF-tv149.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 13,  embeddings: 13,  ms: 153,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-056", file: "NF-tv150.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 17,  embeddings: 17,  ms: 196,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-057", file: "NF-tv151.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 14,  embeddings: 14,  ms: 165,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-058", file: "NF-tv152.csv",  type: "csv", category: "ventilation_data", status: "completed", chunks: 15,  embeddings: 15,  ms: 174,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Threshold Exceedances ─────────────────────────────────────
  { id: "LOG-059", file: "NF-Metaller_gt20pct_Fysiskt.csv",       type: "csv", category: "threshold_exceedances", status: "completed", chunks: 13,  embeddings: 13,  ms: 149,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-060", file: "NF-Oorganiskt_Damm_gt20pct_Fysiskt.csv",type: "csv", category: "threshold_exceedances", status: "completed", chunks: 11,  embeddings: 11,  ms: 131,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Risk Models ───────────────────────────────────────────────
  { id: "LOG-061", file: "NF-Riskbedömning.csv",        type: "csv", category: "risk_models", status: "completed", chunks: 24,  embeddings: 24,  ms: 272,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-062", file: "NF-Riskbedömningsmodell.csv", type: "csv", category: "risk_models", status: "completed", chunks: 18,  embeddings: 18,  ms: 208,   date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-063", file: "NF-Områdesindelning.csv",     type: "csv", category: "risk_models", status: "completed", chunks: 10,  embeddings: 10,  ms: 121,   date: "2026-05-28", triggeredBy: "Scheduler" },

  // ── Reference Docs ────────────────────────────────────────────
  { id: "LOG-064", file: "NF-Blad1.csv",               type: "csv", category: "reference_docs", status: "completed", chunks: 4,   embeddings: 4,   ms: 58,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-065", file: "NF-Hygienregler_NF.csv",     type: "csv", category: "reference_docs", status: "completed", chunks: 7,   embeddings: 7,   ms: 89,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-066", file: "NF-Information.csv",         type: "csv", category: "reference_docs", status: "completed", chunks: 5,   embeddings: 5,   ms: 68,    date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-067", file: "NF-Innehållsförteckning.csv",type: "csv", category: "reference_docs", status: "completed", chunks: 3,   embeddings: 3,   ms: 44,    date: "2026-05-28", triggeredBy: "Scheduler" },
];
