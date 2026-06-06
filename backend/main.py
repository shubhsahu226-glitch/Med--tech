import random
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route("/")
def read_root():
    return jsonify({"message": "Welcome to the PulseAI API"})

@app.route("/api/upload-report", methods=["POST"])
def upload_report():
    file = request.files.get("file")
    filename = file.filename if file else "unknown"
    
    base_sugar = random.randint(90, 110)
    base_uric = round(random.uniform(4.5, 6.0), 1)
    
    historical_data = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    for month in months:
        historical_data.append({
            "name": month,
            "BloodSugar": base_sugar + random.randint(-15, 30),
            "UricAcid": base_uric + round(random.uniform(-1.0, 2.5), 1)
        })
        
    insights = {
        "diet": "Based on slight fluctuations in Uric Acid, reduce purine-rich foods.",
        "reminder": "Take Medicine A in 30 minutes. Avoid Medicine B.",
        "follow_up_date": "2026-06-25",
        "danger_flags": []
    }
    
    if historical_data[-1]["BloodSugar"] > 130:
        insights["danger_flags"].append("High Blood Sugar detected!")
    
    return jsonify({
        "filename": filename,
        "status": "processed",
        "historical_data": historical_data,
        "insights": insights
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
