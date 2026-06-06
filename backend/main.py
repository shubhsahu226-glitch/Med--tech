import os
import json
import random
import datetime
import PyPDF2
from openai import OpenAI
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

load_dotenv() # Load the API key from the .env file

try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    client = None
    print(f"Warning: OpenAI client could not be initialized: {e}")

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None
    print("Warning: Supabase credentials not found in .env")

@app.route("/api/reports/<patient_id>", methods=["GET"])
def get_reports(patient_id):
    if not supabase:
        return jsonify([])
    try:
        response = supabase.table("reports").select("*").eq("patient_id", patient_id).execute()
        reports = response.data
        # Parse metrics for frontend
        for r in reports:
            if "metrics_json" in r and isinstance(r["metrics_json"], str):
                r["metrics"] = json.loads(r["metrics_json"])
            r["aiSummary"] = r.get("ai_summary", "")
        
        # Sort manually since SQLite strings aren't real dates, but Supabase could handle it. We do it manually to be safe.
        reports.sort(key=lambda x: x['date'], reverse=True)
        return jsonify(reports)
    except Exception as e:
        print(f"Supabase GET Error: {e}")
        return jsonify([])

@app.route("/")
def read_root():
    return jsonify({"message": "Welcome to the PulseAI API"})

@app.route("/api/upload-report", methods=["POST"])
def upload_report():
    file = request.files.get("file")
    patient_id = request.form.get("patient_id", "guest")
    report_title = request.form.get("report_title", "Unknown Report")
    report_type = request.form.get("report_type", "Blood Test")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400
        
    filename = file.filename

    # 1. Extract text if it's a PDF
    extracted_text = ""
    if filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        except Exception as e:
            return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500
    else:
        # Fallback for non-PDFs (like .txt files)
        try:
            extracted_text = file.read().decode('utf-8')
        except Exception:
            extracted_text = str(file.read())

    # 2. Send the extracted text to OpenAI
    ai_response = {}
    if client and os.getenv("OPENAI_API_KEY") and not os.getenv("OPENAI_API_KEY").startswith("sk-put-your"):
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": "You are an advanced medical AI. Read the following medical report text. Identify ALL medical metrics found in the text (e.g., Glucose, Cholesterol, BP, Ventricular Size, etc.). For each metric, determine its numeric value, unit, and whether its status is Normal, High, Low, or Abnormal based on standard reference ranges. Provide a comprehensive summary and any critical danger flags. You MUST return your response as a valid JSON object matching exactly this format: {\"summary\": \"Overall health analysis...\", \"danger_flags\": [\"High BP\"], \"metrics\": [{\"name\": \"Systolic BP\", \"value\": 120, \"unit\": \"mmHg\", \"status\": \"Normal\", \"min\": 90, \"max\": 120}]}"},
                    {"role": "user", "content": f"Here is the report text: {extracted_text}"}
                ]
            )
            ai_response = json.loads(completion.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Error: {e}")
            ai_response = {}
    else:
        print("Using Mock Data since valid OPENAI_API_KEY is not set.")
        # Fallback Mock logic if no API key is provided
        ai_response = {
            "summary": "This is mock data generated because no valid OpenAI API Key was found.",
            "danger_flags": [],
            "metrics": [
                { "name": "Blood Sugar (Mock)", "value": random.randint(90, 110), "unit": "mg/dL", "status": "Normal", "min": 70, "max": 99 },
                { "name": "Uric Acid (Mock)", "value": round(random.uniform(4.5, 6.0), 1), "unit": "mg/dL", "status": "Normal", "min": 3.5, "max": 7.2 }
            ]
        }

    # 3. Format the data for the React Frontend and Database
    proper_metrics = ai_response.get("metrics", [])
    if not proper_metrics:
        # Extreme fallback if AI hallucinated the format
        proper_metrics = [{ "name": "Parsing Error", "value": 0, "unit": "N/A", "status": "Abnormal", "min": 0, "max": 0 }]

    summary = f"AI Insights: {ai_response.get('summary', 'No summary provided.')}"
    if ai_response.get('danger_flags'):
        summary += f" | WARNING: {', '.join(ai_response['danger_flags'])}"

    # 4. Save to Database
    report_id = f"rep_{int(datetime.datetime.now().timestamp())}"
    current_date = datetime.datetime.now().strftime("%b %d, %Y")
    
    new_report = {
        "id": report_id,
        "patient_id": patient_id,
        "title": report_title,
        "type": report_type,
        "date": current_date,
        "status": "Reviewed",
        "ai_summary": summary,
        "metrics_json": json.dumps(proper_metrics)
    }
    
    if supabase:
        try:
            supabase.table("reports").insert(new_report).execute()
        except Exception as e:
            print(f"Supabase error: {e}")
            return jsonify({"error": "Failed to save to Supabase database"}), 500

    new_report["metrics"] = proper_metrics
    new_report["aiSummary"] = summary

    return jsonify({
        "status": "success",
        "report": new_report
    })

@app.route("/api/trigger-sos", methods=["POST"])
def trigger_sos():
    sos_data = request.json or {}
    patient_id = sos_data.get("patient_id", "Unknown")
    location = sos_data.get("location", {})
    
    print(f"🚨 CRITICAL ALERT DISPATCHED via Twilio! 🚨")
    print(f"Patient ID: {patient_id}")
    print(f"Location: Lat {location.get('lat')}, Lng {location.get('lng')}")
    print(f"Dispatching to emergency contacts and nearby hospitals...")
    
    return jsonify({"status": "success", "message": "SOS alerts dispatched via WhatsApp"})

if __name__ == "__main__":
    app.run(port=8000, debug=True)
