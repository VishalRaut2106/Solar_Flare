import os
import json
import requests
import datetime
import random
import pandas as pd
import numpy as np
import torch
# Limit PyTorch threads to reduce RAM usage on free tier servers
torch.set_num_threads(1)
import torch.nn as nn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from fastapi.responses import FileResponse, HTMLResponse
import io

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
        <head>
            <title>SolarSim API</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="background-color: #121212; color: #00ffcc; font-family: monospace; padding: 40px 20px; text-align: center; margin: 0;">
            <h1>🚀 SolarSim Live Backend is RUNNING!</h1>
            <p style="color: #aaa; margin-bottom: 30px;">This is the digital twin inference engine for Aditya-L1 telemetry.</p>
            
            <div style="margin: 30px 0;">
                <a href="https://expo.dev/artifacts/eas/P7pddWprVkWXU4Rsa1hrO6wkSEO7opaaiUkM-IJh3RI.apk" style="display: inline-block; background-color: #00ffcc; color: #121212; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 24px; margin: 10px; font-family: sans-serif;">↓ Download Android APK</a>
                <a href="https://github.com/VishalRaut2106/Solar_Flare" style="display: inline-block; background-color: #2b3137; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 24px; margin: 10px; font-family: sans-serif;">View Source on GitHub</a>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
                <p>Status Endpoint: <a href="/api/v1/status" style="color:#fff;">/api/v1/status</a></p>
                <p>Graph Endpoint: <a href="/api/v1/lightcurve" style="color:#fff;">/api/v1/lightcurve</a></p>
            </div>
        </body>
    </html>
    """

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# PyTorch Model Definition
class FlareLSTM(nn.Module):
    def __init__(self):
        super(FlareLSTM, self).__init__()
        self.lstm = nn.LSTM(5, 64, 2, batch_first=True)
        self.fc = nn.Linear(64, 2)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out[:, -1, :])

# Load Model
model = FlareLSTM()
model_path = 'solar_lstm.pth'
if os.path.exists(model_path):
    model.load_state_dict(torch.load(model_path, weights_only=True))
    model.eval()
    print("Loaded PyTorch model.")
else:
    print(f"Warning: {model_path} not found. Running with untrained model weights.")

alert_data = {
    "timestamp": "",
    "flare_probability": 0.0,
    "alert_level": "UNKNOWN",
    "lead_time_mins": 15,
    "method": "Live Hybrid (NOAA + ISRO LSTM)",
    "cme_alert": False,
    "cme_class": "None",
    "sensors": {
        "swis_speed": 450.0,
        "aspex_flux": "3.2e+08",
        "papa_density": 5.40,
        "suit_uv": 1.20
    },
    "trending": [
        {"id": "1", "name": "Magnetic Field", "change": "↑ 2.1 nT", "trendUp": True},
        {"id": "2", "name": "Solar Wind", "change": "↑ 450.0 km/s", "trendUp": True},
        {"id": "3", "name": "Particle Density", "change": "↑ 5.4 cm³", "trendUp": True}
    ]
}

sim_state = {
    "swis_speed": 450.0,
    "aspex_flux": 3.2e8,
    "papa_density": 5.4,
    "suit_uv": 1.2
}

def fetch_live_data():
    global alert_data
    print(f"[{datetime.datetime.now()}] Fetching live NOAA GOES data...")
    try:
        url = "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json"
        response = requests.get(url, timeout=(5, 15))
        data = response.json()
        
        # NOAA gives short (hard X-rays equivalent) and long (soft X-rays equivalent)
        # We only need the last 2 hours (approx 240 items), truncate to save RAM
        df = pd.DataFrame(data[-300:])
        # Convert UTC from NOAA to Indian Standard Time (IST) for the dashboard
        df['time'] = pd.to_datetime(df['time_tag'], utc=True).dt.tz_convert('Asia/Kolkata')
        
        # Split by energy band
        df_short = df[df['energy'] == '0.05-0.4nm'].rename(columns={'flux': 'hard_flux'})[['time', 'hard_flux']]
        df_long = df[df['energy'] == '0.1-0.8nm'].rename(columns={'flux': 'soft_flux'})[['time', 'soft_flux']]
        
        # Merge exactly like we did for SoLEXS/HEL1OS
        fused = pd.merge_asof(df_long.sort_values('time'), df_short.sort_values('time'), on='time')
        fused = fused.dropna().tail(120) # Last 2 hours
        
        if len(fused) < 10:
            print("Not enough live data.")
            return

        # Feature Extraction (same as ISRO training)
        fused['flux_ratio'] = fused['hard_flux'] / (fused['soft_flux'] + 1e-10)
        fused['soft_rise'] = fused['soft_flux'].diff().fillna(0)
        fused['hard_spike'] = fused['hard_flux'].diff().fillna(0)
        
        # Prepare Tensor for LSTM
        # We need the last 60 minutes (if 1 minute resolution)
        recent = fused.tail(60).copy()
        
        # Normalization (mocked min-max scaling for the prototype)
        features = ['soft_flux', 'hard_flux', 'flux_ratio', 'soft_rise', 'hard_spike']
        for col in features:
            recent[col] = (recent[col] - recent[col].min()) / (recent[col].max() - recent[col].min() + 1e-10)
            
        tensor_input = torch.tensor(recent[features].values, dtype=torch.float32).unsqueeze(0)
        
        # Live Inference
        with torch.no_grad():
            probs = torch.softmax(model(tensor_input), dim=1)
            flare_prob = probs[0][1].item()
            
        alert_level = 'HIGH' if flare_prob > 0.7 else ('MEDIUM' if flare_prob > 0.4 else 'LOW')
        timestamp = fused['time'].iloc[-1].strftime('%Y-%m-%d %H:%M:%S UTC')
        
        # Realistic Physics-Coupled Simulator (No Randomness)
        # If flare probability is high, simulate an incoming CME by ramping up secondary payloads
        target_swis = 400.0 + (flare_prob * 400.0)
        target_aspex = 1e7 + (flare_prob * 8e8)
        target_papa = 3.0 + (flare_prob * 15.0)
        target_suit = 1.0 + (flare_prob * 2.0)
        
        # Smoothly interpolate towards target to mimic natural physical acceleration
        sim_state["swis_speed"] += (target_swis - sim_state["swis_speed"]) * 0.1
        sim_state["aspex_flux"] += (target_aspex - sim_state["aspex_flux"]) * 0.1
        sim_state["papa_density"] += (target_papa - sim_state["papa_density"]) * 0.1
        sim_state["suit_uv"] += (target_suit - sim_state["suit_uv"]) * 0.1
        
        cme_alert = True if flare_prob > 0.3 else False
        cme_class = "X-Class" if flare_prob > 0.7 else ("M-Class" if flare_prob > 0.4 else ("C-Class" if flare_prob > 0.2 else "None"))
        
        # Deterministic Trending Logic
        mag_field_change = round(flare_prob * 5.0, 1)
        mag_trend = True if flare_prob > 0.3 else False
        
        alert_data.update({
            "timestamp": timestamp,
            "flare_probability": flare_prob,
            "alert_level": alert_level,
            "cme_alert": cme_alert,
            "cme_class": cme_class,
            "sensors": {
                "swis_speed": round(sim_state["swis_speed"], 1),
                "aspex_flux": f"{sim_state['aspex_flux']:.1e}",
                "papa_density": round(sim_state["papa_density"], 2),
                "suit_uv": round(sim_state["suit_uv"], 2)
            },
            "trending": [
                {"id": "1", "name": "Magnetic Field", "change": f"{'↑' if mag_trend else '↓'} {mag_field_change} nT", "trendUp": mag_trend},
                {"id": "2", "name": "Solar Wind", "change": f"{'↑' if sim_state['swis_speed'] > 450 else '↓'} {round(sim_state['swis_speed'], 1)} km/s", "trendUp": (sim_state["swis_speed"] > 450)},
                {"id": "3", "name": "Particle Density", "change": f"{'↑' if sim_state['papa_density'] > 5.4 else '↓'} {round(sim_state['papa_density'], 1)} cm³", "trendUp": (sim_state["papa_density"] > 5.4)}
            ]
        })
        
        # Generate the Light Curve Plot for the dashboard
        plt.style.use('dark_background')
        plt.rcParams.update({'font.size': 12, 'axes.linewidth': 1.5})
        plt.figure(figsize=(8, 4))
        plt.plot(fused['time'], fused['soft_flux'], label='SoLEXS Proxy (0.1-0.8nm)', color='#00ffcc', linewidth=2)
        plt.plot(fused['time'], fused['hard_flux'], label='HEL1OS Proxy (0.05-0.4nm)', color='#ff3b3b', linewidth=2)
        plt.yscale('log')
        
        # Add Standard Flare Class Reference Lines for Scientific Accuracy
        flare_classes = {'X': 1e-4, 'M': 1e-5, 'C': 1e-6, 'B': 1e-7, 'A': 1e-8}
        for cls_name, flux_val in flare_classes.items():
            plt.axhline(y=flux_val, color='#888888', linestyle='--', alpha=0.3, linewidth=1)
            # Add text label slightly above the line
            plt.text(fused['time'].iloc[1], flux_val * 1.2, f'{cls_name}-Class', color='#aaaaaa', fontsize=9, alpha=0.8)

        # Standardize scientific limits instead of arbitrary bounding
        y_max = fused['soft_flux'].max()
        plt.ylim(1e-9, max(1e-3, y_max * 5.0))
            
        plt.title('Live Satellite X-ray Flux', fontsize=16, pad=15)
        plt.ylabel('Watts / m²', fontsize=14)
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
        plt.xticks(rotation=45)
        plt.grid(color='#333333', linestyle='--', alpha=0.5)
        plt.legend(loc='upper right', frameon=True, facecolor='#121212', edgecolor='#333')
        plt.tight_layout(pad=1.5)
        plt.savefig('lightcurve.png', dpi=300, facecolor='#121212')
        plt.clf()
        plt.close('all')
        
        print(f"Update successful! Prob: {flare_prob:.2%}, Alert: {alert_level}")
        
        # Aggressive memory cleanup
        import gc
        del df, df_short, df_long, fused, recent, tensor_input, probs
        gc.collect()
        
    except Exception as e:
        print(f"Error fetching live data: {e}")

# Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_live_data, 'interval', seconds=60)
scheduler.start()

# Do an initial fetch right on startup
fetch_live_data()

@app.get("/api/v1/status")
def get_status():
    return alert_data

@app.get("/api/v1/lightcurve")
def get_lightcurve():
    if os.path.exists('lightcurve.png'):
        return FileResponse('lightcurve.png')
    return {"error": "Graph not yet generated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
