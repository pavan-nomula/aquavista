/*******************************************************************************
 * AQUAVISTA - SMART AQUARIUM CONTROLLER FIRMWARE (ESP32)
 * 
 * Features:
 *  - Removed Blynk completely (No Blynk libraries/tokens needed).
 *  - Built-in Local REST Web Server (Port 80) with full CORS support.
 *  - Live 2-way link with the AquaVista Web Dashboard.
 *  - Fixed pin conflict (TDS on Pin 33, LDR on Pin 34).
 *  - Fixed GPIO 35 input-only bug: Drain Pump moved to GPIO 18.
 *  - Single unified 16x2 I2C LCD (cycles live status and local IP).
 *  - Hardware-level safety interlocks (heater low-water cutoff, pump mutual exclusion).
 *  - Non-blocking loop for zero-latency HTTP responses.
 *******************************************************************************/

#include <WiFi.h>
#include <WebServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <ESP32Servo.h>

/******************* WIFI CREDENTIALS *******************/
const char* ssid = "Bhanu";
const char* pass = "N.rambabu@1986#";

/******************* AQUAVISTA DASHBOARD LINK *******************/
const char* DASHBOARD_URL = "https://aquavista-dashboard.vercel.app/";
const char* LOCAL_DASHBOARD_URL = "http://localhost:5173/";

/******************* ESP32 PIN CONFIGURATION *******************/
// Sensors
#define ONE_WIRE_BUS       4    // DS18B20 Temperature Data Pin
#define TRIG_PIN           13   // Ultrasonic HC-SR04 Trig Pin
#define ECHO_PIN           12   // Ultrasonic HC-SR04 Echo Pin
#define TDS_SENSOR_PIN     33   // Analog TDS Sensor (ADC1_CH5)
#define LDR_PIN            34   // Analog LDR Light Sensor (ADC1_CH6 - Input Only)
#define BUZZER_PIN         27   // Piezo Buzzer

// Actuators & Relays
#define SERVO_PIN          23   // Servo Motor (Fish Feeder)
#define RELAY_HEATER_PIN   25   // Aquarium Heater Relay
#define RELAY_PUMP_PIN     32   // Main Circulation / Aeration Pump Relay
#define RELAY_LIGHT_PIN    26   // Aquarium Light Relay
#define RELAY_DRAIN_PIN    18   // Drain Pump (Pump OUT) - (Moved from GPIO 35 which is input-only)
#define RELAY_FILL_PIN     14   // Fill Pump (Pump IN)

// Relay Module Polarity
// Most 5V relay modules trigger on LOW (Active LOW). If yours triggers on HIGH, set to false.
#define RELAY_ACTIVE_LOW   true

/******************* HARDWARE OBJECTS *******************/
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
LiquidCrystal_I2C lcd(0x27, 16, 2);   // Change address to 0x3F if your I2C module uses it
RTC_DS3231 rtc;
Servo feederServo;
WebServer server(80);

/******************* GLOBAL STATE VARIABLES *******************/
// Sensor Telemetry
float temperature   = 25.0; // °C
float waterLevelCM  = 0.0;
float waterPercent  = 80.0; // %
float tdsValue      = 250.0;// ppm
int   lightLevel    = 400;  // lux / raw
String rtcTimeString = "00:00:00";
bool   rtcFound      = false;

// Actuator States
bool heaterOn    = false;
bool airPumpOn   = true;
bool lightOn     = false;
bool fillPumpOn  = false;
bool drainPumpOn = false;
bool isFeeding   = false;

// Control Modes
bool manualHeaterMode = false;
bool manualPumpMode   = false;
bool manualLightMode  = false;
bool manualPumpsMode  = false; // Manual control of Drain/Fill

// Thresholds
float tempThreshold  = 26.0; // °C
float tdsThreshold   = 400.0;// ppm
const int tankHeight = 30;   // cm

// Automatic Water Change State
bool autoWaterChangeActive = false;
String waterChangePhase    = "idle"; // "idle", "draining", "refilling"
int targetDrainPercent     = 30;
int targetRefillPercent    = 80;

// Non-blocking Timing (millis)
unsigned long lastSensorReadTime = 0;
unsigned long lastLcdUpdateTime   = 0;
unsigned long lastFeedStartTime   = 0;
int lcdScreenIndex               = 0;

/******************* HELPER: RELAY SWITCHING *******************/
void setRelay(int pin, bool state) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, state ? LOW : HIGH);
  } else {
    digitalWrite(pin, state ? HIGH : LOW);
  }
}

/******************* CORS & PRIVATE NETWORK HELPER *******************/
void sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Access-Control-Request-Private-Network");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

/******************* SENSOR READING FUNCTIONS *******************/
void readSensors() {
  // 1. Temperature
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t > -50.0 && t < 80.0) {
    temperature = t;
  }

  // 2. Ultrasonic Water Level
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout (~4 meters max)
  if (duration > 0) {
    float dist = (duration * 0.0343) / 2.0;
    float level = tankHeight - dist;
    waterLevelCM = constrain(level, 0.0, (float)tankHeight);
    waterPercent = (waterLevelCM / (float)tankHeight) * 100.0;
  }

  // 3. TDS Sensor on Pin 33
  int rawTds = analogRead(TDS_SENSOR_PIN);
  float voltage = rawTds * (3.3 / 4095.0);
  tdsValue = voltage * 400.0; // Calibration factor
  if (tdsValue < 0) tdsValue = 0;

  // 4. LDR Light Sensor on Pin 34
  int rawLdr = analogRead(LDR_PIN);
  // Map raw 0-4095 inverted: higher light = lower resistance
  lightLevel = map(rawLdr, 0, 4095, 800, 20);
  if (lightLevel < 0) lightLevel = 0;

  // 5. RTC Time
  if (rtcFound) {
    DateTime now = rtc.now();
    char buf[10];
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
    rtcTimeString = String(buf);
  }
}

/******************* SAFETY & AUTOMATION LOGIC *******************/
void processAutomationAndSafety() {
  // 1. CRITICAL SAFETY: Low-water heater interlock (< 30%)
  if (waterPercent < 30.0 && heaterOn) {
    heaterOn = false;
    setRelay(RELAY_HEATER_PIN, false);
    tone(BUZZER_PIN, 1200, 300);
  }

  // 2. CRITICAL SAFETY: Mutual exclusion on Fill and Drain pumps
  if (drainPumpOn && fillPumpOn) {
    fillPumpOn = false;
    setRelay(RELAY_FILL_PIN, false);
  }

  // 3. Automatic Heater Regulation (if not in manual mode)
  if (!manualHeaterMode) {
    if (temperature < tempThreshold && waterPercent >= 30.0) {
      heaterOn = true;
    } else if (temperature >= tempThreshold + 0.3) {
      heaterOn = false;
    }
    setRelay(RELAY_HEATER_PIN, heaterOn);
  }

  // 4. Automatic Lighting based on LDR (if not in manual mode)
  if (!manualLightMode) {
    lightOn = (lightLevel < 150); // Turn light ON when dark
    setRelay(RELAY_LIGHT_PIN, lightOn);
  }

  // 5. Automated Water Change Routine
  if (autoWaterChangeActive) {
    if (waterChangePhase == "draining") {
      drainPumpOn = true;
      fillPumpOn  = false;
      setRelay(RELAY_DRAIN_PIN, true);
      setRelay(RELAY_FILL_PIN, false);

      if (waterPercent <= targetDrainPercent) {
        waterChangePhase = "refilling";
      }
    } else if (waterChangePhase == "refilling") {
      drainPumpOn = false;
      fillPumpOn  = true;
      setRelay(RELAY_DRAIN_PIN, false);
      setRelay(RELAY_FILL_PIN, true);

      if (waterPercent >= targetRefillPercent) {
        fillPumpOn  = false;
        setRelay(RELAY_FILL_PIN, false);
        autoWaterChangeActive = false;
        waterChangePhase = "idle";
      }
    }
  }

  // 6. High TDS Buzzer Alarm
  if (tdsValue > tdsThreshold) {
    tone(BUZZER_PIN, 1000, 80);
  }

  // 7. Feeder Servo Release Check
  if (isFeeding && (millis() - lastFeedStartTime > 1500)) {
    feederServo.write(0);
    isFeeding = false;
  }
}

/******************* 16x2 LCD DISPLAY REFRESH *******************/
void updateLcd() {
  lcd.clear();
  switch (lcdScreenIndex) {
    case 0:
      // Screen 1: Temp & Water Level
      lcd.setCursor(0, 0);
      lcd.print("Temp: ");
      lcd.print(temperature, 1);
      lcd.print((char)223);
      lcd.print("C");

      lcd.setCursor(0, 1);
      lcd.print("Water: ");
      lcd.print((int)waterPercent);
      lcd.print("% ");
      lcd.print(heaterOn ? "[HEAT]" : "[OK]");
      break;

    case 1:
      // Screen 2: TDS & Light
      lcd.setCursor(0, 0);
      lcd.print("TDS: ");
      lcd.print((int)tdsValue);
      lcd.print(" ppm");

      lcd.setCursor(0, 1);
      lcd.print("Light: ");
      lcd.print(lightLevel);
      lcd.print(" lx");
      break;

    case 2:
      // Screen 3: WiFi IP Address (for dashboard linking)
      lcd.setCursor(0, 0);
      lcd.print("AquaVista IP:");
      lcd.setCursor(0, 1);
      if (WiFi.status() == WL_CONNECTED) {
        lcd.print(WiFi.localIP());
      } else {
        lcd.print("WiFi Disconn...");
      }
      break;
  }

  lcdScreenIndex = (lcdScreenIndex + 1) % 3;
}

/******************* FISH FEEDING ACTION *******************/
void triggerFeeder() {
  feederServo.write(180);
  isFeeding = true;
  lastFeedStartTime = millis();
}

/******************* REST API ROUTE HANDLERS *******************/
// OPTIONS handler for CORS preflight
void handleOptions() {
  sendCorsHeaders();
  server.send(204);
}

// Root page - Built-in Live Interactive Local Dashboard
void handleRoot() {
  sendCorsHeaders();
  String ipStr = WiFi.localIP().toString();
  String html = "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<title>AquaVista Live Controller</title>";
  html += "<style>";
  html += "*{box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#070d18;color:#f8fafc;padding:20px 14px;margin:0;}";
  html += ".wrap{max-width:680px;margin:auto;}";
  html += ".header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;}";
  html += "h1{color:#38bdf8;margin:0;font-size:22px;letter-spacing:-0.5px;}h1 span{color:#06b6d4;}";
  html += ".badge{background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);padding:4px 10px;border-radius:20px;font-size:12px;font-family:monospace;}";
  html += ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;}";
  html += ".card{background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.2);border-radius:14px;padding:14px;text-align:center;}";
  html += ".lbl{color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;}";
  html += ".val{font-size:24px;font-weight:800;color:#f8fafc;margin-top:4px;font-family:monospace;}";
  html += ".val small{font-size:14px;color:#38bdf8;}";
  html += ".sec-title{font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:16px 0 10px;}";
  html += ".actuators{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:16px;}";
  html += ".btn-dev{display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.9);border:1px solid #1e293b;border-radius:12px;padding:12px 14px;color:#f8fafc;cursor:pointer;font-size:13px;font-weight:600;width:100%;text-align:left;transition:all 0.2s;}";
  html += ".btn-dev.active{border-color:#06b6d4;background:rgba(6,182,212,0.15);color:#a5f3fc;}";
  html += ".pill{font-size:10px;padding:2px 8px;border-radius:10px;background:#1e293b;color:#94a3b8;font-family:monospace;}";
  html += ".btn-dev.active .pill{background:#06b6d4;color:#070d18;font-weight:800;}";
  html += ".actions{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}";
  html += ".btn-action{flex:1;min-width:140px;padding:12px;border-radius:12px;border:none;background:#06b6d4;color:#070d18;font-weight:800;cursor:pointer;font-size:13px;transition:0.2s;}";
  html += ".btn-action:hover{background:#38bdf8;}";
  html += ".footer-card{background:rgba(15,23,42,0.6);border:1px solid rgba(56,189,248,0.2);border-radius:14px;padding:14px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;}";
  html += ".footer-card a{color:#38bdf8;text-decoration:none;font-weight:700;}";
  html += "</style></head><body>";
  html += "<div class='wrap'>";
  html += "<div class='header'><h1>AQUA<span>VISTA</span> CONTROLLER</h1><span class='badge' id='statusBadge'>IP: " + ipStr + "</span></div>";

  html += "<div class='grid'>";
  html += "<div class='card'><div class='lbl'>Temperature</div><div class='val' id='temp'>--<small>°C</small></div></div>";
  html += "<div class='card'><div class='lbl'>Water Level</div><div class='val' id='water'>--<small>%</small></div></div>";
  html += "<div class='card'><div class='lbl'>TDS Quality</div><div class='val' id='tds'>--<small>ppm</small></div></div>";
  html += "<div class='card'><div class='lbl'>Ambient Light</div><div class='val' id='light'>--<small>lx</small></div></div>";
  html += "</div>";

  html += "<div class='sec-title'>Live Actuator Relays</div>";
  html += "<div class='actuators'>";
  html += "<button class='btn-dev' id='btn-heater' onclick='toggleDev(\"heater\")'><span>♨️ Heater</span><span class='pill' id='p-heater'>OFF</span></button>";
  html += "<button class='btn-dev' id='btn-airPump' onclick='toggleDev(\"airPump\")'><span>💨 Air Pump</span><span class='pill' id='p-airPump'>OFF</span></button>";
  html += "<button class='btn-dev' id='btn-light' onclick='toggleDev(\"light\")'><span>💡 Light</span><span class='pill' id='p-light'>OFF</span></button>";
  html += "<button class='btn-dev' id='btn-fillPump' onclick='toggleDev(\"fillPump\")'><span>🚰 Fill Pump</span><span class='pill' id='p-fillPump'>OFF</span></button>";
  html += "<button class='btn-dev' id='btn-drainPump' onclick='toggleDev(\"drainPump\")'><span>🔄 Drain Pump</span><span class='pill' id='p-drainPump'>OFF</span></button>";
  html += "</div>";

  html += "<div class='actions'>";
  html += "<button class='btn-action' onclick='triggerFeed()'>🐟 Dispense Food (Servo)</button>";
  html += "<button class='btn-action' style='background:#f59e0b;color:#070d18;' onclick='triggerWaterChange()'>🔄 Auto Water Change</button>";
  html += "</div>";

  html += "<div class='footer-card'>";
  html += "<div>Live streaming directly from ESP32. Synced every 1.5s.</div>";
  html += "<div style='margin-top:6px;'><a href='" + String(DASHBOARD_URL) + "' target='_blank'>Open Full Cloud Dashboard (Vercel) &rarr;</a></div>";
  html += "</div>";
  html += "</div>";

  html += "<script>";
  html += "let state = {};";
  html += "async function poll(){try{";
  html += "let r = await fetch('/api/status');let d = await r.json();state = d;";
  html += "document.getElementById('temp').innerHTML = d.temperature + '<small>°C</small>';";
  html += "document.getElementById('water').innerHTML = d.waterLevel + '<small>%</small>';";
  html += "document.getElementById('tds').innerHTML = d.tds + '<small>ppm</small>';";
  html += "document.getElementById('light').innerHTML = d.lightLevel + '<small>lx</small>';";
  html += "updBtn('heater', d.heater);";
  html += "updBtn('airPump', d.airPump);";
  html += "updBtn('light', d.light);";
  html += "updBtn('fillPump', d.fillPump);";
  html += "updBtn('drainPump', d.drainPump);";
  html += "}catch(e){console.warn(e);}}";
  html += "function updBtn(id, on){let b = document.getElementById('btn-'+id);let p = document.getElementById('p-'+id);if(!b||!p)return;";
  html += "if(on){b.classList.add('active');p.innerText='ON';}else{b.classList.remove('active');p.innerText='OFF';}}";
  html += "async function toggleDev(dev){let cur = state[dev] || false;let next = !cur;";
  html += "updBtn(dev, next);";
  html += "await fetch('/api/device?device='+dev+'&state='+(next?1:0),{method:'POST'});poll();}";
  html += "async function triggerFeed(){alert('Dispensing fish feed...');await fetch('/api/feed',{method:'POST'});}";
  html += "async function triggerWaterChange(){if(confirm('Start automated water change cycle?')){await fetch('/api/waterchange?action=start',{method:'POST'});poll();}}";
  html += "setInterval(poll, 1500);poll();";
  html += "</script></body></html>";

  server.send(200, "text/html", html);
}

// GET /api/status - Returns complete telemetry and device states
void handleApiStatus() {
  sendCorsHeaders();

  String json = "{";
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"waterLevel\":" + String(waterPercent, 1) + ",";
  json += "\"waterDistanceCM\":" + String(tankHeight - waterLevelCM, 1) + ",";
  json += "\"tds\":" + String((int)tdsValue) + ",";
  json += "\"lightLevel\":" + String(lightLevel) + ",";
  json += "\"heater\":" + String(heaterOn ? "true" : "false") + ",";
  json += "\"airPump\":" + String(airPumpOn ? "true" : "false") + ",";
  json += "\"light\":" + String(lightOn ? "true" : "false") + ",";
  json += "\"fillPump\":" + String(fillPumpOn ? "true" : "false") + ",";
  json += "\"drainPump\":" + String(drainPumpOn ? "true" : "false") + ",";
  json += "\"feederDispensing\":" + String(isFeeding ? "true" : "false") + ",";
  json += "\"autoWaterChange\":" + String(autoWaterChangeActive ? "true" : "false") + ",";
  json += "\"waterChangePhase\":\"" + waterChangePhase + "\",";
  json += "\"rtcTime\":\"" + rtcTimeString + "\",";
  json += "\"uptimeSeconds\":" + String(millis() / 1000);
  json += "}";

  server.send(200, "application/json", json);
}

// POST/GET /api/device?device=heater&state=1
void handleApiDevice() {
  sendCorsHeaders();

  String device = server.hasArg("device") ? server.arg("device") : "";
  String stateStr = server.hasArg("state") ? server.arg("state") : "";
  bool targetState = (stateStr == "1" || stateStr == "true" || stateStr == "on");

  bool success = true;

  if (device == "heater") {
    manualHeaterMode = true;
    if (targetState && waterPercent < 30.0) {
      success = false; // Interlocked
      heaterOn = false;
    } else {
      heaterOn = targetState;
    }
    setRelay(RELAY_HEATER_PIN, heaterOn);
  }
  else if (device == "airPump") {
    manualPumpMode = true;
    airPumpOn = targetState;
    setRelay(RELAY_PUMP_PIN, airPumpOn);
  }
  else if (device == "light") {
    manualLightMode = true;
    lightOn = targetState;
    setRelay(RELAY_LIGHT_PIN, lightOn);
  }
  else if (device == "fillPump") {
    manualPumpsMode = true;
    fillPumpOn = targetState;
    if (fillPumpOn) {
      drainPumpOn = false;
      setRelay(RELAY_DRAIN_PIN, false);
    }
    setRelay(RELAY_FILL_PIN, fillPumpOn);
  }
  else if (device == "drainPump") {
    manualPumpsMode = true;
    drainPumpOn = targetState;
    if (drainPumpOn) {
      fillPumpOn = false;
      setRelay(RELAY_FILL_PIN, false);
    }
    setRelay(RELAY_DRAIN_PIN, drainPumpOn);
  }
  else {
    success = false;
  }

  String res = "{\"success\":" + String(success ? "true" : "false") + ",\"device\":\"" + device + "\",\"state\":" + String(targetState ? "true" : "false") + "}";
  server.send(success ? 200 : 400, "application/json", res);
}

// POST/GET /api/feed
void handleApiFeed() {
  sendCorsHeaders();
  triggerFeeder();
  server.send(200, "application/json", "{\"success\":true,\"action\":\"feed_dispensed\"}");
}

// POST/GET /api/waterchange?action=start&drainTo=30&fillTo=80
void handleApiWaterChange() {
  sendCorsHeaders();

  String action = server.hasArg("action") ? server.arg("action") : "start";
  if (action == "start") {
    if (server.hasArg("drainTo")) targetDrainPercent = server.arg("drainTo").toInt();
    if (server.hasArg("fillTo"))  targetRefillPercent = server.arg("fillTo").toInt();
    autoWaterChangeActive = true;
    waterChangePhase = "draining";
  } else {
    autoWaterChangeActive = false;
    waterChangePhase = "idle";
    drainPumpOn = false;
    fillPumpOn  = false;
    setRelay(RELAY_DRAIN_PIN, false);
    setRelay(RELAY_FILL_PIN, false);
  }

  server.send(200, "application/json", "{\"success\":true,\"action\":\"" + action + "\",\"phase\":\"" + waterChangePhase + "\"}");
}

/******************* SETUP *******************/
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[AQUAVISTA] Starting Smart Aquarium Controller...");

  // Setup Pin Modes
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(TDS_SENSOR_PIN, INPUT);

  pinMode(RELAY_HEATER_PIN, OUTPUT);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_LIGHT_PIN, OUTPUT);
  pinMode(RELAY_DRAIN_PIN, OUTPUT);
  pinMode(RELAY_FILL_PIN, OUTPUT);

  // Set all relays to initial safe states (OFF)
  setRelay(RELAY_HEATER_PIN, false);
  setRelay(RELAY_PUMP_PIN, true);   // Circulation pump ON by default
  setRelay(RELAY_LIGHT_PIN, false);
  setRelay(RELAY_DRAIN_PIN, false);
  setRelay(RELAY_FILL_PIN, false);

  // Initialize Servo
  feederServo.attach(SERVO_PIN);
  feederServo.write(0);

  // Initialize I2C and LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print(" AquaVista V2.0 ");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");

  // Initialize Temperature Sensor
  tempSensor.begin();

  // Initialize RTC
  if (rtc.begin()) {
    rtcFound = true;
    Serial.println("[RTC] DS3231 Initialized successfully.");
    if (rtc.lostPower()) {
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  } else {
    rtcFound = false;
    Serial.println("[RTC] DS3231 not detected on I2C bus.");
  }

  // Connect to WiFi
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 25) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("==================================================");
    Serial.println(">> AQUAVISTA DASHBOARD LINKS:");
    Serial.print("   Cloud: ");
    Serial.println(DASHBOARD_URL);
    Serial.print("   Local: ");
    Serial.println(LOCAL_DASHBOARD_URL);
    Serial.print(">> In Dashboard Settings, enter this ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("==================================================");

    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Running in offline/autonomous mode.");
    lcd.print("WiFi Offline");
    lcd.setCursor(0, 1);
    lcd.print("Local Safe Mode");
  }
  delay(2000);

  // Setup REST Web Server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleApiStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);

  server.on("/api/device", HTTP_GET, handleApiDevice);
  server.on("/api/device", HTTP_POST, handleApiDevice);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);

  server.on("/api/feed", HTTP_GET, handleApiFeed);
  server.on("/api/feed", HTTP_POST, handleApiFeed);
  server.on("/api/feed", HTTP_OPTIONS, handleOptions);

  server.on("/api/waterchange", HTTP_GET, handleApiWaterChange);
  server.on("/api/waterchange", HTTP_POST, handleApiWaterChange);
  server.on("/api/waterchange", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("[HTTP] REST API Server listening on port 80.");
}

/******************* MAIN LOOP *******************/
void loop() {
  // 1. Handle incoming HTTP REST requests (Zero delay)
  server.handleClient();

  // 2. Read sensors periodically every 1000ms
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorReadTime >= 1000) {
    lastSensorReadTime = currentMillis;
    readSensors();
    processAutomationAndSafety();
  }

  // 3. Cycle LCD screens every 3000ms
  if (currentMillis - lastLcdUpdateTime >= 3000) {
    lastLcdUpdateTime = currentMillis;
    updateLcd();
  }
}
