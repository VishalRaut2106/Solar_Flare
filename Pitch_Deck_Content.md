# SolarSim - Pitch Deck Content (Tailored for Problem Statement 15)

*Copy and paste these sections directly into your ISRO BAH 2026 PPT Template.*

---

## Slide: Opportunity

Traditional solar flare monitoring often relies on manual observation of light curves or retrospective data analysis, which is too slow for active satellite protection. **SolarSim** introduces a fully automated, end-to-end algorithmic pipeline designed specifically for the dual X-ray spectra (Soft and Hard X-rays) captured by Aditya-L1’s SoLEXS and HEL1OS payloads. Unlike typical monolithic web dashboards, our solution fuses a deterministic physics-coupled AI backend with an **On-Call Engineer Mobile Pager**, allowing continuous 24/7 **Nowcasting** and **Forecasting** push-alerts to infrastructure managers when they are away from the command center.

**How will it be able to solve the problem?**
SolarSim solves the problem by continuously parsing dual-band X-ray proxy data in real-time. 
*   **For Nowcasting (Primary):** The algorithm instantly evaluates abrupt gradients in the light curves, generating a master catalogue of detected low/high-class flares. 
*   **For Forecasting (Primary):** The deep-learning PyTorch LSTM model identifies subtle precursor patterns in the combined soft/hard X-ray flux before the actual eruption. When these pre-flare signatures are detected, the system triggers a predictive alert, providing a quantifiable lead time (e.g., 15-30 minutes) to safeguard infrastructure.
*   **CME Monitoring (Secondary):** While X-ray fluxes predict flares, the Digital Twin engine simultaneously tracks secondary targets like Coronal Mass Ejections (CMEs) by monitoring the simulated solar wind and particle density (SWIS & PAPA).

1. **Deterministic Digital Twin & AI Engine:** Purpose-built LSTM trained on multi-wavelength X-ray time-series data to detect precursor gradients, which mathematically drives secondary payload simulators (SWIS/PAPA) without relying on random noise.
2. **On-Call Engineer Pager:** A natively compiled iOS/Android interface designed strictly for alerting engineers away from their desks, triggering immediate visual alarms and Server-Side Rendered (SSR) telemetry when a flare is forecasted.

---

## Slide: List of features offered by the solution

*   **Algorithmic Nowcasting Module:** Real-time event detection evaluating combined Soft (SoLEXS proxy) and Hard (HEL1OS proxy) X-ray flux.
*   **LSTM Forecasting Engine:** Neural network continuously predicting the probability of a flare occurring in the next *N* minutes based on precursor pattern recognition.
*   **Visual Alert Pager:** A highly responsive React Native mobile dashboard that dynamically displays Server-Side Rendered (SSR) Matplotlib light curves and instantly flashes high-priority warnings upon detection, saving edge-device battery.
*   **Master Flare Catalogue:** Automated background logging of detected events (class A, B, C, M, X) with timestamps and peak flux values.

*(Presentation Tip: Include a screenshot of the app’s red "Anomaly Warning" state next to a snapshot of the live lightcurve graph.)*

---

## Slide: Process flow diagram or Use-case diagram

*(Presentation Tip: Draw a 4-step flowchart in PowerPoint)*

1.  **Data Acquisition:** Automated scripts continuously read real-time Soft & Hard X-ray time-series data (NOAA GOES proxy for SoLEXS/HEL1OS).
2.  **Algorithmic Processing (Nowcasting):** Backend independent algorithms evaluate flux gradients to detect active flares.
3.  **Predictive Modelling (Forecasting):** PyTorch LSTM time-series model identifies precursor patterns in the combined dataset to calculate flare probability.
4.  **Interface Visualization:** The React Native mobile client pulls the API state, rendering the X-ray light curves and triggering visual UI alerts if a flare is imminent.

---

## Slide: Wireframes/Mock diagrams of the proposed solution

<p align="center">
  <img src="assets/screenshot1.png" width="200" alt="App Home" style="margin: 0 10px;" />
  <img src="assets/screenshot2.png" width="200" alt="Telemetry Dashboard" style="margin: 0 10px;" />
  <img src="assets/screenshot3.png" width="200" alt="Live Lightcurve" style="margin: 0 10px;" />
</p>

*(Action Required: Create an `assets` folder in your project, save the 3 screenshots I provided as `screenshot1.png`, `screenshot2.png`, and `screenshot3.png`, and they will automatically appear here!)*

---

## Slide: Architecture diagram of the proposed solution

*(Presentation Tip: Draw a 3-tier architecture diagram)*

*   **Tier 1: Data Ingestion (Python Script)**
    *   Continuous retrieval of Soft & Hard X-ray proxy telemetry.
*   **Tier 2: Backend & AI Engine (FastAPI + PyTorch)**
    *   Hosted on Render.com
    *   **Nowcast Algorithm:** Gradient thresholds & cataloging.
    *   **Forecast Model:** Time-series LSTM predicting *N*-minute lead times.
    *   **Graph Renderer:** Matplotlib light curve generation.
*   **Tier 3: UI/UX Client (React Native Alert Pager)**
    *   Cross-platform mobile app rendering SSR visualizations and handling cold-start connection states gracefully.

---

## Slide: Technologies to be used in the solution

**Backend & Predictive Modelling:**
*   **Python 3:** Core logic and pipeline scripting.
*   **PyTorch:** Deep learning framework for the LSTM time-series forecasting model.
*   **Scikit-Learn / Pandas / Numpy:** For array manipulation, feature extraction, and cataloging.
*   **FastAPI & Uvicorn:** High-performance async REST API.
*   **Matplotlib:** For programmatic generation of X-ray light curves.

**Interface & Visualization:**
*   **React Native & Expo:** For cross-platform (iOS/Android) mobile visualization and alert triggering.
*   **Axios:** For low-latency data polling.

**Deployment:**
*   **Render.com:** Cloud hosting for the AI backend.
*   **Expo Application Services (EAS):** Cloud build pipeline for APK generation.

---

## Slide: Estimated implementation cost (optional)

*   **Current Prototype Cost:** **$0.00**
    *   Backend hosted on Render Free Tier.
    *   Mobile app compiled via Expo EAS Free Tier.
    *   All ML training performed on local hardware/free cloud notebooks.

*   **Production Deployment (Handling full ISSDC PRADAN data streams):** **~$30.00 / month**
    *   Dedicated AWS EC2 or Render backend instances to ensure 100% uptime for continuous Nowcasting.
    *   *Note: The React Native edge-client deployment scales indefinitely at zero cost since all heavy computation is handled server-side.*

---

## Slide: Scientific References & Literature
*(Presentation Tip: Add this slide near the end to prove deep domain research).*

Our pipeline and ML feature engineering are directly informed by the latest (2025-2026) Aditya-L1 calibration literature:
*   **SoLEXS In-flight Performance (arXiv: 2509.26292):** Used to understand cross-calibration between GOES proxy data and Aditya-L1 SoLEXS thermal emission data.
*   **HEL1OS Instrument Paper (arXiv: 2512.12679):** Guided our fusion approach, combining SoLEXS (soft/thermal) with HEL1OS (hard/non-thermal) for accurate impulsive phase detection.
*   **Iron Fluorescence in X-class Flares:** Used to identify spectral anomalies during high-energy events for LSTM feature weighting.
