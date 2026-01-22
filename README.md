# Arduino Footstep Energy Generator - Web Monitor

A real-time web dashboard to monitor and visualize data from your Arduino footstep energy generator.

## Features

- 📊 Real-time voltage and step count monitoring
- 🔌 Direct serial connection to Arduino via Web Serial API
- 📈 Statistics tracking (max voltage, average voltage, session time)
- 📝 Activity log with timestamps
- 🎨 Beautiful, responsive design
- ⚡ Visual feedback for step detection

## Requirements

- Modern browser with Web Serial API support:
  - Google Chrome (version 89+)
  - Microsoft Edge (version 89+)
  - Opera (version 75+)
- Arduino connected via USB with the footstep generator code uploaded

## Setup Instructions

### 1. Upload Arduino Code

Upload the provided Arduino sketch to your board with the piezo sensor connected.

### 2. Open the Web Interface

1. Open `index.html` in a supported browser (Chrome recommended)
2. Click "Connect to Arduino"
3. Select your Arduino's COM port from the popup dialog
4. Click "Connect"

### 3. Monitor Data

- View real-time voltage readings (in mV)
- Track total step count
- Monitor statistics and activity log

## How It Works

The web interface uses the **Web Serial API** to communicate directly with the Arduino through the browser. The Arduino sends data in the format:

```
Voltage: 45 mV   Steps: 5
```

The JavaScript parses this data and updates the dashboard in real-time.

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and animations
- `script.js` - Serial communication and data processing logic
- `README.md` - This file

## Troubleshooting

**"Web Serial API not supported" error:**

- Use Chrome, Edge, or Opera browser
- Ensure browser is up to date

**Can't connect to Arduino:**

- Check USB connection
- Ensure Arduino is not open in Arduino IDE Serial Monitor
- Verify correct baud rate (9600) in Arduino code

**No data showing:**

- Check Serial Monitor in Arduino IDE first to verify data output
- Ensure Arduino is running the footstep generator code
- Try disconnecting and reconnecting

## Controls

- **Connect to Arduino** - Establish serial connection
- **Clear Log** - Clear activity log entries
- **Reset Counter** - Reset step count and statistics

## Browser Compatibility

| Browser | Supported | Notes                        |
| ------- | --------- | ---------------------------- |
| Chrome  | ✅ Yes    | Recommended                  |
| Edge    | ✅ Yes    | Full support                 |
| Opera   | ✅ Yes    | Full support                 |
| Firefox | ❌ No     | Web Serial API not supported |
| Safari  | ❌ No     | Web Serial API not supported |

## Testing Without Arduino

To test the interface without an Arduino connected, uncomment the last line in `script.js`:

```javascript
setInterval(simulateArduinoData, 2000);
```

This will simulate random data for testing purposes.

## License

Free to use and modify for educational purposes.
