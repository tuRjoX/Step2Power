#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const int piezoPin = A0;
const int ledPin   = 13;

LiquidCrystal_I2C lcd(0x27, 16, 2);

const int stepTrigger_mV = 25;   
const int resetLevel_mV  = 30;   

const unsigned long pressWindow  = 60;
const unsigned long debounceTime = 250;

int stepCount = 0;
unsigned long lastStepTime = 0;

bool armed = true;  

void setup() {
  Serial.begin(9600);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("Step2Power");
  delay(1500);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Steps: 0");
  lcd.setCursor(0, 1);
  lcd.print("Volt: 0mV");
}

void loop() {
  int peakRaw = 0;
  unsigned long start = millis();

  while (millis() - start < pressWindow) {
    int val = analogRead(piezoPin);
    if (val > peakRaw) peakRaw = val;
  }

  int peak_mV = (peakRaw * 5000L) / 1023;

  unsigned long now = millis();

  // ------------------ STEP COUNT LOGIC ------------------
  if (armed &&
      peak_mV >= stepTrigger_mV &&
      (now - lastStepTime) > debounceTime) {

    stepCount++;
    lastStepTime = now;
    armed = false; // lock after counting 1 step

    // Update steps on LCD
    lcd.setCursor(7, 0);
    lcd.print("     ");
    lcd.setCursor(7, 0);
    lcd.print(stepCount);

    // LED blink
    digitalWrite(ledPin, HIGH);
    delay(60);
    digitalWrite(ledPin, LOW);
  }

  // ------------------ RESET DISPLAY VOLTAGE LOGIC ------------------
  int display_mV = peak_mV;

  if (!armed && peak_mV <= resetLevel_mV) {
    display_mV = 0;  
    armed = true;    
  }

  // ------------------ LCD VOLTAGE DISPLAY ------------------
  lcd.setCursor(6, 1);
  lcd.print("      ");
  lcd.setCursor(6, 1);
  lcd.print(display_mV);
  lcd.print("mV");

  // ------------------ SERIAL OUTPUT (for website) ------------------
  Serial.print(stepCount);
  Serial.print(",");
  Serial.println(display_mV);

  delay(50);
}
