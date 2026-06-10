const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

/**
 * Fetch detailed structured sections and parameters for a specific report.
 * @param {string} reportId - The unique report ID.
 * @returns {Promise<Array>} List of report sections with nested metrics/parameters.
 */
export const fetchReportSectionsAndParameters = async (reportId) => {
  if (!reportId) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/sections`);
    if (!response.ok) {
      throw new Error(`Failed to fetch report sections: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("fetchReportSectionsAndParameters error:", error);
    return [];
  }
};

/**
 * Fetch patient biomarker historical trends for plotting graphs.
 * @param {string} patientId - The patient identifier.
 * @returns {Promise<Array>} List of pivoted timeline data points.
 */
export const fetchParameterHistoryTrends = async (patientId) => {
  if (!patientId) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/${patientId}/trends`);
    if (!response.ok) {
      throw new Error(`Failed to fetch historical trends: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("fetchParameterHistoryTrends error:", error);
    return [];
  }
};

/**
 * Fetch active clinical warnings and out-of-bounds metrics alerts.
 * @param {string} patientId - The patient identifier.
 * @returns {Promise<Array>} List of clinical alerts.
 */
export const fetchPatientAlerts = async (patientId) => {
  if (!patientId) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/${patientId}/alerts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("fetchPatientAlerts error:", error);
    return [];
  }
};
