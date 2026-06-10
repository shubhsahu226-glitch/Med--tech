# How Virtual Vaidya Works - A Simple Guide

This guide explains how the Virtual Vaidya medical report feature works in simple, plain English. You do not need any coding or technical knowledge to understand it!

---

## 1. The Three Main Parts
To understand the system, think of it as a modern digital clinic with three workers:

1. **The Bulletin Board (The Screen / Frontend)**: This is what you see on your computer or phone. It has the buttons, the file upload boxes, the colorful menus, and the trend charts. It is the face of the application.
2. **The Smart Clerk (The Brain / Backend)**: This worker sits in the background. It takes files from the Bulletin Board, reads through them, communicates with the Artificial Intelligence (AI) to figure out what the medical reports mean, and files the results away.
3. **The Secure Filing Cabinet (The Storage & Database)**: This is a secure digital vault. It has labeled drawers for user profiles, laboratory reports, historical test values, and active warnings.

---

## 2. Step-by-Step Workflow: How a Report is Analyzed

Here is exactly what happens when you upload a lab test, from the moment you click "Upload" to the moment the charts appear:

### Step 1: You Upload the Document
* You select a photo (like a JPEG or PNG) or a PDF document of your blood test on the screen.
* The screen checks that the file size is not too large (under 5 Megabytes) and reminds you to make sure the date is visible.

### Step 2: The Smart Clerk Inspects the Document
* The file is passed to the background Clerk.
* If it is a PDF, the Clerk reads the typed text directly.
* If it is a photo, the Clerk takes the picture and prepares it to be read visually.

### Step 3: The AI Double-Checks the Document
* The Clerk hands the document to the **Google Gemini AI** and asks: *"Is this actually a medical laboratory report?"*
* **The Verification Check**:
  * **If you uploaded the wrong file** (for example, a photo of a restaurant receipt, a nature landscape, or an invoice), the AI notices it is not a medical report. It rejects the file and tells the Clerk why. The screen then shows you a friendly message: *"The uploaded file is not recognized as a medical report. Please upload a valid report."*
  * **If it is a valid medical report**, the AI reads all the complex test names (like Hemoglobin, Fasting Blood Sugar, or Cholesterol) along with their values and reference ranges. It also writes a simple, easy-to-understand summary of your results.

### Step 4: Storing in the Digital Vault
Once the AI extracts all the correct data, the Clerk files everything into the Secure Filing Cabinet:
* **The original file** is stored in a secure folder so you can view it later.
* **Test Folders** are created for different health categories (like a folder for **Blood**, a folder for **Sugar**, a folder for **Kidneys**, etc.).
* **Red Warning Flags (Alerts)**: If any of your metrics are too high or too low compared to normal standards, a red warning flag is created and placed in your notifications box (for example: *"Abnormal Fasting Glucose"*).
* **The Timeline Diary**: The values are logged in a chronological diary with the date, creating a history of your readings.

### Step 5: Visualizing Your Health
The screen updates instantly to show you the results:
* **Detailed Review Tab**: You see your test results organized under clean cards (e.g., Blood, Lipid, Sugar) with color-coded badges showing whether they are **Normal**, **High**, or **Low**.
* **Alerts Bell**: The notification bell at the top of the page alerts you to any red warning flags.
* **Trends Tab**: The system automatically pulls your historical readings from the timeline diary and draws a line graph (like a stock chart). You can select a test (such as "Glucose") and see a line tracking whether your levels are going up, down, or staying stable over time.

---

## 3. Quick Summary of the Technology Used
For reference, here are the real-world technologies that play the roles of our three digital clinic workers:
* **The Bulletin Board (Frontend)**: Built using **React** (a tool for creating interactive screens) and **Recharts** (a tool for drawing visual line graphs).
* **The Smart Clerk (Backend)**: Built using **Python Flask** (a tool for handling file traffic and server directions).
* **The AI Engine**: Powering the Clerk's decisions is **Google Gemini API** (specifically the `gemini-3.1-flash-lite` model), which reads images and text.
* **The Secure Filing Cabinet (Database)**: Powered by **Supabase** (a secure cloud database and file storage vault).
