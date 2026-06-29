import os
import json
import pandas as pd
from astropy.io import fits
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ---------------------------------------------------------
# Phase 1: Data Fusion & Feature Engineering
# ---------------------------------------------------------

def timestamp2datetime(time_arr, ref_date=datetime(2023, 1, 1)):
    """Convert Aditya-L1 timestamps (seconds since epoch) to datetime objects."""
    return [ref_date + timedelta(seconds=float(t)) for t in time_arr]

def load_solexs_fits(file_path):
    """Load SoLEXS light curve data"""
    print(f"Loading SoLEXS data from {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"SoLEXS file {file_path} not found.")
        
    with fits.open(file_path) as hdul:
        data = hdul[1].data
        time_col = data['TIME']
        counts_col = data['COUNTS']
        
        df = pd.DataFrame({
            'time': timestamp2datetime(time_col),
            'soft_flux': counts_col.byteswap().view(counts_col.dtype.newbyteorder()) if hasattr(counts_col, 'byteswap') else counts_col
        })
    return df.sort_values('time')

def generate_mock_hel1os(solexs_df):
    """Generates mock HEL1OS data correlated with SoLEXS (Neupert effect)."""
    df = solexs_df.copy()
    soft_diff = df['soft_flux'].diff().fillna(0)
    df['hard_flux'] = np.maximum(0, soft_diff * 0.1 + np.random.normal(10, 5, len(df)))
    return df[['time', 'hard_flux']]

def fuse_data(solexs_path):
    """Fuses datasets and engineers physics features."""
    solexs_df = load_solexs_fits(solexs_path)
    hel1os_df = generate_mock_hel1os(solexs_df) # Using mock for demonstration

    print("Synchronizing timelines...")
    fused_df = pd.merge_asof(
        solexs_df, hel1os_df, 
        on='time', 
        direction='nearest', 
        tolerance=pd.Timedelta('2s')
    )

    print("Extracting physical features (Flux ratio, Rise, Spike)...")
    fused_df = fused_df.set_index('time').resample('1s').mean().ffill().reset_index()
    fused_df['flux_ratio'] = fused_df['hard_flux'] / (fused_df['soft_flux'] + 1e-10)
    fused_df['soft_rise'] = fused_df['soft_flux'].diff().fillna(0)
    fused_df['hard_spike'] = fused_df['hard_flux'].diff().fillna(0)
    
    return fused_df

# ---------------------------------------------------------
# Phase 2: Heuristic Forecasting (Rules-Based)
# ---------------------------------------------------------

def generate_heuristic_alert(df, output_json_path):
    print("Running Heuristic Forecaster...")
    # Simulate a real-time check by looking at the very last 5 minutes of data
    last_5_mins = df.tail(300)
    
    # Rule 1: Is the soft X-ray flux high? (Above 90th percentile)
    threshold = df['soft_flux'].quantile(0.90)
    current_soft_flux = last_5_mins['soft_flux'].mean()
    
    # Rule 2: Is it rising sharply?
    recent_rise = last_5_mins['soft_rise'].mean()
    
    # Rule 3: Is there a hard X-ray spike?
    recent_spike = last_5_mins['hard_spike'].max()

    # Calculate probability heuristically
    probability = 0.1 # base 10%
    if current_soft_flux > threshold:
        probability += 0.3
    if recent_rise > 10: 
        probability += 0.3
    if recent_spike > 5: 
        probability += 0.2

    probability = min(0.95, probability)
    alert_level = "HIGH" if probability > 0.7 else ("MEDIUM" if probability > 0.4 else "LOW")
    
    alert_data = {
        "timestamp": datetime.now().isoformat(),
        "flare_probability": probability,
        "alert_level": alert_level,
        "lead_time_mins": 15,
        "method": "Heuristic Rule-Based"
    }
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w') as f:
        json.dump(alert_data, f, indent=4)
        
    print(f"Prediction complete! Dashboard API updated at {output_json_path}")
    print(f"Result: {probability*100:.1f}% Probability of Flare ({alert_level} Alert)")

# ---------------------------------------------------------
# Main Execution
# ---------------------------------------------------------

if __name__ == "__main__":
    print("="*50)
    print("STARTING SOLAR FLARE PIPELINE")
    print("="*50)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    solexs_file = os.path.join(base_dir, 'data', 'AL1_SOLEXS_20241025_SDD2_L1.lc.gz')
    
    # Output path targets the app directory so the React Native UI can read it
    output_api_file = os.path.join(base_dir, '..', 'app', 'flare_alerts.json')
    
    try:
        # Phase 1
        unified_df = fuse_data(solexs_file)
        
        # Phase 2
        generate_heuristic_alert(unified_df, output_api_file)
        
        print("="*50)
        print("PIPELINE SUCCESSFUL")
        print("="*50)
    except Exception as e:
        print(f"PIPELINE FAILED: {str(e)}")
