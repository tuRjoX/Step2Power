#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const int piezoPin = A0;
const int ledPin = 13;

LiquidCrystal_I2C lcd(0x27, 16, 2);

// -------------------- SMART TILE STEP DETECTION --------------------
// Instead of waiting for voltage to go to 0, we use HYSTERESIS:
// - Count step when peak goes ABOVE stepHigh_mV
// - Re-arm when peak goes BELOW stepLow_mV
// This works for continuous walking (real-world vibration).

const int stepHigh_mV = 30; // step detected above this
const int stepLow_mV = 15;  // re-arm below this (must be lower than stepHigh_mV)

// Extra noise filter
const int noiseFloor_mV = 8;

// Timing
const unsigned long pressWindow = 60;   // sample window to find peak
const unsigned long debounceTime = 250; // minimum time between steps (ms)

int stepCount = 0;
unsigned long lastStepTime = 0;

// Step state
bool armed = true;

void setup()
{
    Serial.begin(9600);
    Serial.println("Footstep Smart Tile Started...");

    pinMode(ledPin, OUTPUT);
    digitalWrite(ledPin, LOW);

    lcd.init();
    lcd.backlight();

    lcd.setCursor(0, 0);
    lcd.print("Smart Tile Step");
    lcd.setCursor(0, 1);
    lcd.print("Counter Ready");
    delay(1500);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Steps: 0");
    lcd.setCursor(0, 1);
    lcd.print("Volt: 0mV");
}

void resetDisplay()
{
    stepCount = 0;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Steps: 0");
    lcd.setCursor(0, 1);
    lcd.print("Volt: 0mV");

    Serial.println("RESET DONE");
}

void loop()
{
    // -------------------- Read Web/Serial Commands --------------------
    if (Serial.available() > 0)
    {
        String command = Serial.readStringUntil('\n');
        command.trim();

        if (command == "RESET")
        {
            resetDisplay();
            return;
        }
    }

    // -------------------- Get Peak Voltage in pressWindow --------------------
    int peakRaw = 0;
    unsigned long start = millis();

    while (millis() - start < pressWindow)
    {
        int val = analogRead(piezoPin);
        if (val > peakRaw)
            peakRaw = val;
    }

    int peak_mV = (peakRaw * 5000L) / 1023;

    // remove tiny noise spikes
    if (peak_mV < noiseFloor_mV)
        peak_mV = 0;

    // -------------------- LCD Display --------------------
    lcd.setCursor(6, 1);
    lcd.print("      ");
    lcd.setCursor(6, 1);
    lcd.print(peak_mV);
    lcd.print("mV");

    // -------------------- Step Detection (Hysteresis + Debounce) --------------------
    unsigned long now = millis();

    // Re-arm when signal drops low enough (NOT necessarily 0)
    if (!armed && peak_mV <= stepLow_mV)
    {
        armed = true;
    }

    // Count step when armed + high threshold crossed + debounce passed
    if (armed &&
        peak_mV >= stepHigh_mV &&
        (now - lastStepTime) > debounceTime)
    {

        stepCount++;
        lastStepTime = now;
        armed = false; // lock until it drops below stepLow_mV

        // Update LCD steps
        lcd.setCursor(7, 0);
        lcd.print("     ");
        lcd.setCursor(7, 0);
        lcd.print(stepCount);

        // LED blink
        digitalWrite(ledPin, HIGH);
        delay(60);
        digitalWrite(ledPin, LOW);
    }

    // -------------------- Send to Serial (for Website/Monitor) --------------------
    // CSV format for web: steps,voltage
    Serial.print(stepCount);
    Serial.print(",");
    Serial.println(peak_mV);

    delay(50);
}
