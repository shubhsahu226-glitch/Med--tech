const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Upload a laboratory report file for OCR extraction and AI summary.
 * @param {FormData} formData - Contains the file, patient_id, report_title, and report_type.
 * @returns {Promise<object>} The server response containing the newly created report.
 */
export const uploadReportApi = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/upload-report`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload laboratory report. Please check backend connection.");
  }

  return response.json();
};

/**
 * Trigger an emergency SOS alert.
 * @param {string} patientId - The identifier of the patient triggering the SOS.
 * @param {object} location - Object with lat and lng values.
 * @returns {Promise<object>} The server response status.
 */
export const triggerSOSApi = async (patientId, location = { lat: 37.77, lng: -122.41 }) => {
  const response = await fetch(`${API_BASE_URL}/api/trigger-sos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patient_id: patientId,
      location,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to dispatch emergency alerts.");
  }

  return response.json();
};

/**
 * Retrieve all reports for a specific patient.
 * @param {string} patientId - The ID of the patient.
 * @returns {Promise<Array>} List of reports.
 */
export const getReportsApi = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/reports/${patientId}`);
  if (!response.ok) {
    throw new Error("Failed to retrieve medical records.");
  }
  return response.json();
};
