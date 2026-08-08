# 🌱 Smart Hydrophonic System (IoT + Next.js Dashboard)

## 📌 Overview
This project is an IoT-based smart hydrophonic system that monitors and maintains optimal nutrient conditions (pH, TDS, temperature) for plant growth. It uses a closed-loop control mechanism to automatically correct imbalances using pumps, reducing manual effort and improving efficiency.

The system also includes a Next.js-based dashboard for real-time monitoring and visualization.

---

## 🚀 Features
- Real-time monitoring of pH, TDS, and temperature  
- Automated correction using pumps  
- Closed-loop control (Detect → Correct → Verify)  
- Web dashboard for live data visualization  
- Scalable for smart farming applications  

---

## ⚙️ Tech Stack
- **Hardware:** ESP32, Sensors (pH, TDS, Temperature), Pumps, Relay  
- **Frontend:** Next.js  
- **Backend/IoT:** Firebase / MQTT  
- **Programming:** Embedded C (Arduino IDE), JavaScript  

---

## 🧠 How It Works
1. Sensors collect real-time data from the nutrient solution  
2. ESP32 processes and compares with optimal values  
3. If deviation occurs → pumps are activated  
4. System rechecks values and stabilizes conditions  
5. Data is sent to the dashboard for monitoring  

---

## 💻 Getting Started (Dashboard)

```bash
npm install
npm run dev