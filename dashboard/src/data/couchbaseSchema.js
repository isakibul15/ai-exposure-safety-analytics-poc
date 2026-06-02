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
export const mockEmployees = [
  { id: "EMP-001", name: "Dennis Rimstedt",   role: "Machine Operator",    zone: "Sensor / Gula",     status: "active",  gender: "M", bloodLead: 0.47, limit: 1.5, pct: 31.3, badge: "RFID-4421", lastMedical: "2026-02-10" },
  { id: "EMP-002", name: "Maja Lindqvist",     role: "QC Technician",       zone: "XRF Plockhytt 1",   status: "active",  gender: "F", bloodLead: 0.34, limit: 0.5, pct: 68.0, badge: "RFID-3812", lastMedical: "2026-01-15" },
  { id: "EMP-003", name: "Michael Skoglund",   role: "Flotation Engineer",  zone: "Flotation 2.2",     status: "active",  gender: "M", bloodLead: 0.51, limit: 1.5, pct: 34.0, badge: "RFID-2257", lastMedical: "2026-03-01" },
  { id: "EMP-004", name: "Ingrid Karlsson",    role: "Env. Coordinator",    zone: "Finesline / SGM",   status: "active",  gender: "F", bloodLead: 0.29, limit: 0.5, pct: 58.0, badge: "RFID-5531", lastMedical: "2026-02-20" },
  { id: "EMP-005", name: "Lars Bergström",     role: "Sensor Technician",   zone: "Sensor / Gula",     status: "active",  gender: "M", bloodLead: 0.53, limit: 1.5, pct: 35.3, badge: "RFID-6640", lastMedical: "2026-02-12" },
  { id: "EMP-006", name: "Sofia Petersson",    role: "Lab Analyst",         zone: "XRF Plockhytt 2",   status: "active",  gender: "F", bloodLead: 0.31, limit: 0.5, pct: 62.0, badge: "RFID-7712", lastMedical: "2026-01-20" },
  { id: "EMP-007", name: "Anders Nilsson",     role: "Maintenance Tech",    zone: "Dry Sep / IWT",     status: "active",  gender: "M", bloodLead: 0.44, limit: 1.5, pct: 29.3, badge: "RFID-8823", lastMedical: "2026-03-05" },
  { id: "EMP-008", name: "Karin Johansson",    role: "Water Treatment Op.", zone: "Water Treatment",   status: "active",  gender: "F", bloodLead: 0.22, limit: 0.5, pct: 44.0, badge: "RFID-9914", lastMedical: "2026-02-05" },
  { id: "EMP-009", name: "Per Eriksson",       role: "Loader Operator",     zone: "Hjullastare",       status: "active",  gender: "M", bloodLead: 0.18, limit: 1.5, pct: 12.0, badge: "RFID-1025", lastMedical: "2026-01-28" },
  { id: "EMP-010", name: "Britta Magnusson",   role: "HSE Manager",         zone: "Styrhytt",          status: "active",  gender: "F", bloodLead: 0.12, limit: 0.5, pct: 24.0, badge: "RFID-1136", lastMedical: "2026-03-10" },
  { id: "EMP-011", name: "Johan Gustafsson",   role: "Process Operator",    zone: "Flotation 3.2",     status: "active",  gender: "M", bloodLead: 0.49, limit: 1.5, pct: 32.7, badge: "RFID-1247", lastMedical: "2026-02-18" },
  { id: "EMP-012", name: "Anna Olsson",        role: "Safety Inspector",    zone: "Catwalk / Balkong", status: "on_leave", gender: "F", bloodLead: 0.26, limit: 0.5, pct: 52.0, badge: "RFID-1358", lastMedical: "2025-12-10" },
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

// ── Mock RAG ingestion logs (extended) ───────────────────────
export const mockIngestionLogs = [
  { id: "LOG-2026-0528-001", file: "chemsafe_risk_assessment_2026.pdf",    type: "pdf",   status: "completed", chunks: 312, embeddings: 312, ms: 8430,  date: "2026-05-28", triggeredBy: "Scheduler" },
  { id: "LOG-2026-0311-002", file: "measurement_campaign_260311.xlsx",     type: "excel", status: "completed", chunks: 47,  embeddings: 47,  ms: 1204,  date: "2026-03-11", triggeredBy: "EMP-010" },
  { id: "LOG-2025-0122-003", file: "measurement_campaign_250122.xlsx",     type: "excel", status: "completed", chunks: 38,  embeddings: 38,  ms: 990,   date: "2025-01-22", triggeredBy: "EMP-010" },
  { id: "LOG-2024-0229-004", file: "measurement_campaign_240229.xlsx",     type: "excel", status: "completed", chunks: 41,  embeddings: 41,  ms: 1080,  date: "2024-02-29", triggeredBy: "EMP-010" },
  { id: "LOG-2024-0115-005", file: "afs_2020_6_occupational_exposure.pdf", type: "pdf",   status: "completed", chunks: 228, embeddings: 228, ms: 6100,  date: "2024-01-15", triggeredBy: "EMP-010" },
  { id: "LOG-2023-1201-006", file: "ventilation_audit_report_2023.pdf",    type: "pdf",   status: "completed", chunks: 95,  embeddings: 95,  ms: 2510,  date: "2023-12-01", triggeredBy: "Scheduler" },
  { id: "LOG-2023-0223-007", file: "measurement_campaign_230223.xlsx",     type: "excel", status: "completed", chunks: 35,  embeddings: 35,  ms: 880,   date: "2023-02-23", triggeredBy: "EMP-010" },
  { id: "LOG-2022-1105-008", file: "ppe_compliance_report_2022.pdf",       type: "pdf",   status: "error",     chunks: 12,  embeddings: 0,   ms: 340,   date: "2022-11-05", triggeredBy: "EMP-010" },
];
