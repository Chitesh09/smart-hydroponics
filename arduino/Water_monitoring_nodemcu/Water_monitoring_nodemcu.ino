/*
  Smart Hydroponics - Water & pH Monitor for NodeMCU (ESP8266)
  
  Wiring Diagram:
  1. I2C LCD Display (16x2):
     - VCC -> 5V or VV pin (NodeMCU)
     - GND -> GND
     - SDA -> D2 (GPIO4)
     - SCL -> D1 (GPIO5)
     
  2. Ultrasonic Sensor (HC-SR04):
     - VCC -> 5V or VV pin
     - GND -> GND
     - TRIG -> D7 (GPIO13)
     - ECHO -> D8 (GPIO15)
     
  3. Analog pH Sensor:
     - VCC -> 5V
     - GND -> GND
     - PO (Signal) -> A0 (NodeMCU Analog Pin)
     
  Note on NodeMCU Analog Input (A0):
  The NodeMCU (ESP8266) has only ONE analog pin (A0). If you want to connect both 
  a pH sensor and an Analog TDS sensor, you will need to:
  - Option A: Use an external I2C ADC chip like ADS1115 (Highly recommended, as it uses the same I2C SDA/SCL pins as the LCD).
  - Option B: Control power to sensors using Digital Pins (e.g. D3 and D4) to read them sequentially.
  - Option C: Upgrade to an ESP32 board which features multiple ADC channels.
  
  This code reads pH and Ultrasonic water level, and sends it to the Next.js app.
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Initialize LCD (0x27 is the common I2C address, 16 columns, 2 rows)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Pin Definitions
#define TRIG D7
#define ECHO D8

// Wi-Fi Configurations (Update these to match your local Wi-Fi router)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Next.js API Server endpoint (Update with your laptop's Local IP address)
// Example: "http://192.168.1.100:3000/api/telemetry"
const char* serverUrl = "http://YOUR_LAPTOP_IP:3000/api/telemetry";

const int tankHeight = 100; // Tank height in cm

long duration;
float distance;
int percentage;
float phValue = 7.0;
float temperature = 24.5; // Placeholder or read from DS18B20 digital sensor
float tdsValue = 950.0;   // Placeholder if no multiplexer/ADC is attached

void setup()
{
  Serial.begin(115200);

  // Initialize Ultrasonic Pins
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  // Initialize LCD Screen
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Water Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Starting Wi-Fi...");
  delay(1500);

  // Connect to Wi-Fi network
  WiFi.begin(ssid, password);
  Serial.println();
  Serial.print("Connecting to Wi-Fi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(0, 1);
    lcd.print("Connecting...   ");
  }
  
  Serial.println();
  Serial.println("Wi-Fi connected successfully!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Wi-Fi Connected!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP().toString());
  delay(2000);
  lcd.clear();
}

void loop()
{
  // 1. READ ULTRASONIC SENSOR (WATER LEVEL)
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH);
  distance = duration * 0.034 / 2;

  if (distance > tankHeight) {
    distance = tankHeight;
  }

  percentage = ((tankHeight - distance) * 100) / tankHeight;
  if (percentage > 100) percentage = 100;
  if (percentage < 0)   percentage = 0;

  // 2. READ ANALOG pH SENSOR (WITH NOISE FILTERING)
  int buffer_arr[10];
  int temp;

  // Collect 10 samples
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(A0);
    delay(30);
  }

  // Sort the samples in ascending order
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        temp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = temp;
      }
    }
  }

  // Calculate average of the 6 middle samples (removes high/low noise peaks)
  unsigned long avgval = 0;
  for (int i = 2; i < 8; i++) {
    avgval += buffer_arr[i];
  }

  // Convert reading to voltage (based on NodeMCU ADC calibration)
  float voltage = (float)avgval * 3.3 / 1024 / 6;

  // pH Calibration (Adjust 3.5 multiplier based on calibration with pH 7.0 buffer)
  phValue = 3.5 * voltage; 

  // 3. DISPLAY TO LCD
  lcd.setCursor(0, 0);
  lcd.print("Water Level: ");
  lcd.print(percentage);
  lcd.print("%   ");

  lcd.setCursor(0, 1);
  lcd.print("pH Value: ");
  lcd.print(phValue, 2);
  lcd.print("    ");

  // 4. PRINT TO SERIAL MONITOR
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  Serial.print("Water Level: ");
  Serial.print(percentage);
  Serial.println("%");

  Serial.print("Voltage: ");
  Serial.println(voltage);

  Serial.print("pH Value: ");
  Serial.println(phValue);
  Serial.println("--------------------");

  // 5. SEND DATA TO NEXT.JS DASHBOARD API OVER LOCAL WI-FI
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON request body
    String jsonPayload = "{\"ph\":" + String(phValue, 2) + 
                         ",\"tds\":" + String(tdsValue, 1) + 
                         ",\"temperature\":" + String(temperature, 1) + 
                         ",\"waterLevel\":" + String(percentage) + "}";

    Serial.print("Sending POST request to Next.js API... ");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Success Code: ");
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("Error sending POST: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }

    http.end(); // Close connection
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.begin(ssid, password);
  }

  // Send update every 5 seconds (adjust as necessary)
  delay(5000); 
}
