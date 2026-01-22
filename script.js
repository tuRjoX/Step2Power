// ==================== LOADING SCREEN ====================
const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");
const loadingBarFill = document.getElementById("loadingBarFill");

// Loading messages
const loadingMessages = [
  "Loading interface...",
  "Initializing sensors...",
  "Preparing dashboard...",
  "Almost ready...",
  "Welcome!",
];

let messageIndex = 0;

// Update loading message
const messageInterval = setInterval(() => {
  if (messageIndex < loadingMessages.length) {
    loadingText.textContent = loadingMessages[messageIndex];
    messageIndex++;
  }
}, 400);

// Hide loading screen after 2 seconds
setTimeout(() => {
  clearInterval(messageInterval);
  loadingScreen.classList.add("hidden");
  // Remove from DOM after transition
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 500);
}, 2000);

// ==================== ARDUINO MONITOR ====================
// Arduino Monitor Web Interface
let isConnected = false;
let port = null;
let reader = null;
let writer = null;
let stepCount = 0;
let voltageReadings = [];
let totalVoltage = 0;
let sessionStartTime = null;
let sessionTimer = null;

// DOM Elements
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const stepCountEl = document.getElementById("stepCount");
const voltageValueEl = document.getElementById("voltageValue");
const voltageFillEl = document.getElementById("voltageFill");
const activityLogEl = document.getElementById("activityLog");
const connectBtn = document.getElementById("connectBtn");
const clearBtn = document.getElementById("clearBtn");
const totalVoltageEl = document.getElementById("totalVoltage");
const avgVoltageEl = document.getElementById("avgVoltage");
const sessionTimeEl = document.getElementById("sessionTime");

// Check if Web Serial API is supported
if (!("serial" in navigator)) {
  alert(
    "Web Serial API not supported. Please use Chrome, Edge, or Opera browser.",
  );
  connectBtn.disabled = true;
}

// Connect to Arduino
connectBtn.addEventListener("click", async () => {
  if (!isConnected) {
    try {
      // Request port
      port = await navigator.serial.requestPort();

      // Check if port is already open and close it
      if (port.readable || port.writable) {
        try {
          await port.close();
          await new Promise((resolve) => setTimeout(resolve, 500)); // Wait a bit
        } catch (e) {
          console.log("Port was already closed");
        }
      }

      // Open port with baud rate matching Arduino (9600)
      await port.open({ baudRate: 9600 });

      isConnected = true;
      updateConnectionStatus(true);
      connectBtn.textContent = "Disconnect";

      addActivityLog("Connected to Arduino successfully!", "success");

      // Start session timer
      sessionStartTime = Date.now();
      startSessionTimer();

      // Start reading data
      readSerialData();
    } catch (error) {
      console.error("Connection error:", error);
      let errorMsg = "Failed to connect: ";

      if (error.message.includes("Failed to open serial port")) {
        errorMsg += "Port is in use. Please:\n";
        errorMsg += "1. Close Arduino IDE Serial Monitor\n";
        errorMsg += "2. Close any other serial terminal apps\n";
        errorMsg += "3. Unplug and replug the Arduino USB cable\n";
        errorMsg += "4. Try connecting again";
      } else {
        errorMsg += error.message;
      }

      addActivityLog(errorMsg, "error");
      alert(errorMsg.replace(/\n/g, "\n"));
    }
  } else {
    await disconnectArduino();
  }
});

// Read serial data from Arduino
async function readSerialData() {
  while (port.readable && isConnected) {
    reader = port.readable.getReader();

    try {
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Convert Uint8Array to string
        const text = new TextDecoder().decode(value);
        buffer += text;

        // Process complete lines
        let lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        lines.forEach((line) => {
          if (line.trim()) {
            parseArduinoData(line.trim());
          }
        });
      }
    } catch (error) {
      console.error("Read error:", error);
      addActivityLog("Read error: " + error.message, "error");
    } finally {
      reader.releaseLock();
    }
  }
}

// Parse Arduino serial output
function parseArduinoData(line) {
  console.log("Received:", line);

  // Parse CSV format: "steps,voltage"
  // Example: "5,45" means 5 steps, 45 mV
  const parts = line.split(",");

  if (parts.length === 2) {
    const steps = parseInt(parts[0].trim());
    const voltage = parseInt(parts[1].trim());

    if (!isNaN(steps) && !isNaN(voltage)) {
      updateVoltage(voltage);
      updateSteps(steps);

      // Log significant events
      if (voltage > 20) {
        addActivityLog(`Step detected! Voltage: ${voltage} mV`, "info");
      }
    }
  }
}

// Update voltage display
function updateVoltage(voltage) {
  voltageValueEl.textContent = voltage;

  // Update voltage bar (max 100mV)
  const percentage = Math.min((voltage / 100) * 100, 100);
  voltageFillEl.style.width = percentage + "%";

  // Track statistics - only update total voltage if it crosses 35mV
  if (voltage > 35) {
    voltageReadings.push(voltage);
    totalVoltage += voltage;
    totalVoltageEl.textContent = totalVoltage + " mV";

    // Calculate average
    const avg =
      voltageReadings.reduce((a, b) => a + b, 0) / voltageReadings.length;
    avgVoltageEl.textContent = Math.round(avg) + " mV";
  }

  // Visual feedback for high voltage
  if (voltage > 50) {
    voltageValueEl.parentElement.classList.add("step-detected");
    setTimeout(() => {
      voltageValueEl.parentElement.classList.remove("step-detected");
    }, 500);
  }
}

// Update step count
function updateSteps(steps) {
  if (steps > stepCount) {
    stepCountEl.parentElement.classList.add("step-detected");
    setTimeout(() => {
      stepCountEl.parentElement.classList.remove("step-detected");
    }, 500);
  }

  stepCount = steps;
  stepCountEl.textContent = steps;
}

// Update connection status
function updateConnectionStatus(connected) {
  if (connected) {
    statusDot.classList.add("connected");
    statusText.textContent = "Connected";
    statusText.style.color = "#2ecc71";
  } else {
    statusDot.classList.remove("connected");
    statusText.textContent = "Disconnected";
    statusText.style.color = "#e74c3c";
  }
}

// Add activity log entry
function addActivityLog(message, type = "info") {
  // Remove "no activity" message if present
  const noActivity = activityLogEl.querySelector(".no-activity");
  if (noActivity) noActivity.remove();

  const logEntry = document.createElement("p");
  const timestamp = new Date().toLocaleTimeString();
  logEntry.textContent = `[${timestamp}] ${message}`;

  // Color coding
  if (type === "success") logEntry.style.borderLeftColor = "#2ecc71";
  else if (type === "error") logEntry.style.borderLeftColor = "#e74c3c";
  else if (type === "info") logEntry.style.borderLeftColor = "#667eea";

  activityLogEl.insertBefore(logEntry, activityLogEl.firstChild);

  // Limit log entries
  while (activityLogEl.children.length > 50) {
    activityLogEl.removeChild(activityLogEl.lastChild);
  }
}

// Clear activity log
clearBtn.addEventListener("click", () => {
  activityLogEl.innerHTML = '<p class="no-activity">Log cleared</p>';
});

// Disconnect from Arduino
async function disconnectArduino() {
  isConnected = false;

  try {
    if (reader) {
      await reader.cancel();
      reader = null;
    }

    if (port) {
      await port.close();
      port = null;
    }
  } catch (error) {
    console.error("Disconnect error:", error);
    // Force cleanup even if there's an error
    reader = null;
    port = null;
  }

  updateConnectionStatus(false);
  connectBtn.textContent = "Connect to Arduino";
  addActivityLog("Disconnected from Arduino", "info");

  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
}

// Session timer
function startSessionTimer() {
  sessionTimer = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    sessionTimeEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, 1000);
}

// Handle page unload
window.addEventListener("beforeunload", async () => {
  if (isConnected) {
    await disconnectArduino();
  }
});

// Simulate data for testing (remove when using real Arduino)
function simulateArduinoData() {
  if (!isConnected) return;

  const voltage = Math.floor(Math.random() * 100);
  const steps = stepCount + (voltage > 20 ? 1 : 0);

  const line = `Voltage: ${voltage} mV   Steps: ${steps}`;
  parseArduinoData(line);
}

// Uncomment to test without Arduino
// setInterval(simulateArduinoData, 2000);
