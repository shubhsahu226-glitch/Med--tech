/**
 * @typedef {Object} ReportParameter
 * @property {string} id - Unique parameter uuid
 * @property {string} section_id - Parent section uuid
 * @property {string} name - Biomarker name (e.g. Hemoglobin)
 * @property {number} value - Numeric value
 * @property {string} unit - Measurement unit (e.g. g/dL, mg/dL)
 * @property {string} status - Normal, High, Low, or Abnormal
 * @property {number|null} reference_range_min - Reference minimum
 * @property {number|null} reference_range_max - Reference maximum
 */

/**
 * @typedef {Object} ReportSection
 * @property {string} id - Unique section uuid
 * @property {string} report_id - Report id
 * @property {string} section_name - Section identifier (Blood, Sugar, Lipid, Kidney, Other)
 * @property {ReportParameter[]} metrics - Parameters inside this section
 */

/**
 * @typedef {Object} MedicalReport
 * @property {string} id - Unique report id
 * @property {string} patient_id - Associated patient identifier
 * @property {string} title - Report title (e.g. Complete Blood Count)
 * @property {string} type - Category type (e.g. Blood Test, Urine Test)
 * @property {string} date - Local date string formatted (e.g. Jun 10, 2026)
 * @property {string} status - Status state (e.g. Reviewed)
 * @property {string} aiSummary - Structured overall analysis
 * @property {ReportSection[]} [sections] - Structured report sections
 */

export const ReportTypeCategories = {
  BLOOD: "Blood",
  SUGAR: "Sugar",
  LIPID: "Lipid",
  KIDNEY: "Kidney",
  OTHER: "Other"
};
