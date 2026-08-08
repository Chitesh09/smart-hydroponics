/*
  Smart Hydroponics - ESP32 Sensor Telemetry Firmware
  Baud Rate: 115200
  Format: JSON Lines (newline-terminated JSON objects)
  
  Wiring Diagram (Standard ESP32 Pins):
  
  1. Ultrasonic Sensor (HC-SR04):
     - VCC -> 5V
     - GND -> GND
     - TRIG -> GPIO 12 (Output)
     - ECHO -> GPIO 13 (Input)
     
  2. Analog pH Sensor:
     - VCC -> 5V
     - GND -> GND
     - Signal (PO) -> GPIO 32 (Analog ADC1_CH4)
     
  3. Analog TDS Sensor:
     - VCC -> 3.3V or 5V
     - GND -> GND
     - Signal -> GPIO 33 (Analog ADC1_CH5)
*/

// Pin Definitions
#define TRIG_PIN 12
#define ECHO_PIN 13
#define PH_PIN 32
#define TDS_PIN 33

// Physical configuration of the reservoir
const float TANK_EMPTY_DISTANCE = 100.0; // Distance in cm when reservoir is empty
const float TANK_FULL_DISTANCE = 10.0;    // Distance in cm when reservoir is full

void setup() {
  // Initialize Serial communication at 115200 baud
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for Serial to initialize (required for some USB interfaces)
  }

  // Configure pin modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Set ADC attenuation to 11dB (allows reading voltages up to ~3.1-3.3V on ESP32)
  analogSetPinAttenuation(PH_PIN, ADC_11db);
  analogSetPinAttenuation(TDS_PIN, ADC_11db);
}

void loop() {
  // 1. READ ULTRASONIC SENSOR (DISTANCE & WATER LEVEL %)
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  // Calculate distance in cm (Speed of sound = 343 m/s = 0.0343 cm/us)
  float distance = (float)duration * 0.0343 / 2.0;

  // Calculate water level percentage
  int waterLevel = 0;
  if (distance <= TANK_FULL_DISTANCE) {
    waterLevel = 100;
  } else if (distance >= TANK_EMPTY_DISTANCE) {
    waterLevel = 0;
  } else {
    waterLevel = (int)(((TANK_EMPTY_DISTANCE - distance) * 100.0) / (TANK_EMPTY_DISTANCE - TANK_FULL_DISTANCE));
  }

  // 2. READ ANALOG pH SENSOR
  int phRawValues[10];
  int temp;
  
  // Sample 10 readings for stability
  for (int i = 0; i < 10; i++) {
    phRawValues[i] = analogRead(PH_PIN);
    delay(20);
  }
  
  // Sort values to filter noise (median/mean filtering)
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (phRawValues[i] > phRawValues[j]) {
        temp = phRawValues[i];
        phRawValues[i] = phRawValues[j];
        phRawValues[j] = temp;
      }
    }
  }
  
  // Average middle 6 readings
  long phRawAvg = 0;
  for (int i = 2; i < 8; i++) {
    phRawAvg += phRawValues[i];
  }
  
  // ESP32 ADC is 12-bit (0-4095) with a 3.3V reference
  float phVoltage = ((float)phRawAvg / 6.0) * 3.3 / 4095.0;
  // Default non-calibrated conversion. Adjust slope and offset during calibration:
  float phValue = 3.5 * phVoltage; 
  if (phValue > 14.0) phValue = 14.0;
  if (phValue < 0.0) phValue = 0.0;

  // 3. READ ANALOG TDS SENSOR
  int tdsRawValues[10];
  
  // Sample 10 readings for stability
  for (int i = 0; i < 10; i++) {
    tdsRawValues[i] = analogRead(TDS_PIN);
    delay(20);
  }
  
  // Sort values
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (tdsRawValues[i] > tdsRawValues[j]) {
        temp = tdsRawValues[i];
        tdsRawValues[i] = tdsRawValues[j];
        tdsRawValues[j] = temp;
      }
    }
  }
  
  // Average middle 6 readings
  long tdsRawAvg = 0;
  for (int i = 2; i < 8; i++) {
    tdsRawAvg += tdsRawValues[i];
  }
  
  float tdsVoltage = ((float)tdsRawAvg / 6.0) * 3.3 / 4095.0;
  // Convert voltage to TDS value (PPM) at standard 25C (approximate formula)
  float compensationCoefficient = 1.0; // Assume 25C since temp sensor is not installed
  float compensativeVoltage = tdsVoltage / compensationCoefficient;
  float tdsValue = (133.33 * compensativeVoltage * compensativeVoltage * compensativeVoltage 
                    - 255.86 * compensativeVoltage * compensativeVoltage 
                    + 857.39 * compensativeVoltage) * 0.5;
  if (tdsValue < 0) tdsValue = 0;

  // 4. PRINT JSON LINES TO SERIAL INTERFACE
  // Format: {"waterLevel":84,"distance":16.23,"ph":6.12,"tds":1034.52}
  Serial.print("{\"waterLevel\":");
  Serial.print(waterLevel);
  Serial.print(",\"distance\":");
  Serial.print(distance, 2);
  Serial.print(",\"ph\":");
  Serial.print(phValue, 2);
  Serial.print(",\"tds\":");
  Serial.print(tdsValue, 2);
  Serial.println("}"); // println prints the required newline '\n' to terminate the JSON line

  // Wait 1 second before sending the next telemetry reading
  delay(1000);
}
