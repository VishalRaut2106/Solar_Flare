# Solar Flare Forecaster (Problem Statement 15)

## Overview
This project solves **Problem Statement 15: Forecasting and Now-casting of Solar Flares** using data from ISRO's Aditya-L1 spacecraft (SoLEXS and HEL1OS payloads). 

It consists of a fast Python backend for processing FITS data and generating real-time predictive alerts, and a beautiful React Native mobile dashboard for visualization.

## Directory Structure
- `/backend`: Contains the Python data fusion pipeline and heuristic ML algorithms.
- `/backend/data`: Contains the sample Level-1 SoLEXS data file.
- `/app`: The React Native mobile dashboard.

## 1. Running the Backend
The backend processes the raw satellite `.fits` files, fuses them to a 1-second cadence, performs feature engineering (flux ratios, rise rates), and predicts the probability of an incoming flare.

### Requirements
```bash
pip install pandas numpy astropy
```

### Execution
Navigate to the `backend` folder and run the pipeline:
```bash
cd backend
python run_pipeline.py
```
*This will instantly output the live prediction to `../app/flare_alerts.json` for the dashboard to display.*

## 2. Running the Mobile Dashboard
The mobile app acts as an early-warning system. It constantly monitors the AI's output and will flash a high-probability alert if a flare is imminent in the next 15-30 minutes.

### Requirements
Ensure you have Node.js and Expo installed.

### Execution
Navigate to the `app` directory and start the simulator:
```bash
cd app
npm install
npx expo start
```
Use the Expo Go app on your phone, or an Android/iOS emulator on your computer, to view the live dashboard!
