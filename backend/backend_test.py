import io
import json
import unittest
from backend.main import app

class BackendTestSuite(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.app = app.test_client()

    def test_root_endpoint(self):
        """Test that the API root endpoint returns successfully."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("message", data)
        print("OK: Root endpoint working successfully.")

    def test_upload_medical_report_validation(self):
        """Test uploading a valid medical report."""
        report_text = (
            "PATIENT CHECKUP REPORT\n"
            "Patient Name: John Doe\n"
            "Date: June 10, 2026\n\n"
            "LABORATORY RESULTS:\n"
            "Hemoglobin: 14.2 g/dL (Normal range: 13.5 - 17.5)\n"
            "Fasting Blood Sugar: 110 mg/dL (Normal range: 70 - 99) HIGH\n"
            "LDL Cholesterol: 135 mg/dL (Normal range: 0 - 100) HIGH\n"
            "Serum Creatinine: 0.9 mg/dL (Normal range: 0.6 - 1.2)\n"
        )
        
        file_data = {
            'file': (io.BytesIO(report_text.encode('utf-8')), 'blood_report.txt'),
            'patient_id': 'test-patient-123',
            'report_title': 'Annual Metabolic Checkup',
            'report_type': 'Blood Test'
        }
        
        response = self.app.post('/api/upload-report', data=file_data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data.get("status"), "success")
        self.assertIn("report", data)
        
        report = data["report"]
        self.assertEqual(report["title"], "Annual Metabolic Checkup")
        self.assertIn("metrics", report)
        print("OK: Upload and OCR parsing of valid medical report works successfully.")

    def test_reject_non_medical_file(self):
        """Test that uploading a non-medical file gets rejected with a 400 validation error."""
        non_report_text = (
            "WEEKEND SHOPPING LIST\n"
            "1. Organic Milk\n"
            "2. Bananas\n"
            "3. Chicken Breast\n"
            "4. Whole Wheat Bread\n"
            "Total cost: $24.50. Paid by Credit Card."
        )
        
        file_data = {
            'file': (io.BytesIO(non_report_text.encode('utf-8')), 'shopping_list.txt'),
            'patient_id': 'test-patient-123',
            'report_title': 'My Groceries',
            'report_type': 'Other'
        }
        
        response = self.app.post('/api/upload-report', data=file_data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertIn("error", data)
        print(f"OK: Rejection of non-medical file works. Error message returned: {data['error']}")

if __name__ == '__main__':
    unittest.main()
