# SolarSim: A Digital Twin and Deep Learning Architecture for Real-Time Solar Flare and CME Inference

## Abstract
Space weather phenomena, specifically Solar Flares and Coronal Mass Ejections (CMEs), pose severe risks to satellite infrastructure, astronaut safety, and terrestrial power grids. The ability to predict these anomalies with high precision and minimal latency is paramount. This paper details the architecture and implementation of **SolarSim**, a dual-component system designed for the ISRO Aditya-L1 hackathon. SolarSim introduces a novel Long Short-Term Memory (LSTM) deep learning engine coupled with a Digital Twin physics simulator. The system successfully fuses real-time proxy satellite telemetry (via NOAA GOES-16), evaluates it against a PyTorch neural network, and disseminates inference metrics through a highly resilient, low-latency React Native mobile interface.

---

## 1. Introduction
The Sun is a magnetically active star, periodically releasing vast amounts of energy in the form of electromagnetic radiation (Solar Flares) and ionized plasma (CMEs). The ISRO Aditya-L1 mission, equipped with state-of-the-art payloads such as the Solar Ultraviolet Imaging Telescope (SUIT) and the Aditya Solar wind Particle Experiment (ASPEX), represents a significant leap in heliophysics.

However, processing raw Level-1 telemetry from these instruments requires robust computational pipelines to extract actionable intelligence. Our solution addresses this by creating a **Digital Twin Simulator** backed by a **Recurrent Neural Network (RNN)**, allowing for continuous, 24/7 autonomous monitoring and predictive forecasting.

---

## 2. System Architecture

The architecture of SolarSim is bifurcated into two primary ecosystems: a high-throughput computational backend and a reactive edge-client dashboard.

### 2.1 The Backend Inference Engine (FastAPI & PyTorch)
Hosted in a continuous integration environment (Render.com), the backend serves as the brain of the operation.
*   **Data Ingestion & Fusion:** In the absence of real-time public access to Aditya-L1 data streams, the system proxies data from the US NOAA GOES-16 satellite. X-ray flux readings (both short 0.05-0.4nm and long 0.1-0.8nm wavelengths) are queried via RESTful APIs at a 60-second cadence.
*   **Physics Simulation (Digital Twin):** To emulate the broader sensor suite of Aditya-L1, a mathematical random walk model simulates baseline solar wind speed (SWIS), particle density (PAPA), and proton flux distributions. This data naturally drifts to represent standard solar minimum behavior.
*   **Machine Learning Model:** A highly optimized PyTorch LSTM (solar_lstm.pth) evaluates the incoming flux tensors. LSTMs are uniquely suited for this task due to their ability to retain long-term dependencies in time-series data. The model outputs a normalized probabilistic tensor indicating the likelihood of an imminent >M-class or X-class event.

### 2.2 The Mobile Client (React Native & Expo)
The client interface is designed for mission-critical monitoring, built on the React Native framework for cross-platform compatibility (iOS/Android).
*   **State Management & Reactivity:** The application utilizes asynchronous polling mechanisms integrated with React Hooks (useEffect, useState) to sync with the backend. 
*   **Network Resilience:** A fault-tolerant ping system ensures that if the backend telemetry stream drops (e.g., server spin-down or packet loss), the UI gracefully falls back to the last known state and alerts the operator.
*   **Visualization:** Sensor readings are parsed and injected into a custom, dark-mode styling matrix. Historical flux data is requested from the API as a dynamically generated Matplotlib PNG stream (rendered at 300 DPI for retina displays), completely bypassing heavy client-side charting libraries.

---

## 3. Machine Learning Methodology

The predictive engine relies on an LSTM architecture formulated to process sequential multivariate time-series data. 

**Network Topology:**
*   **Input Layer:** 5-dimensional feature vector (Time, Soft Flux, Hard Flux, 1st Derivative of Flux, and Integrated History).
*   **Hidden Layers:** 64 recurrent hidden units distributed across 2 stacked LSTM layers with batch normalization.
*   **Output Layer:** A fully connected linear layer culminating in a Softmax activation, outputting a bivariate probability distribution (Anomaly vs. Nominal).

**Training Paradigm:**
The model was pre-trained offline using historical Level-1 astronomical .fits data files containing confirmed solar flare anomalies spanning a solar cycle. The training utilized the Adam optimizer and Cross-Entropy Loss to penalize false negatives, prioritizing mission safety.

---

## 4. Implementation Details & Endpoints

The backend exposes a highly optimized REST API designed for minimal payload overhead:

*   **GET /api/v1/status**: Returns the primary JSON payload containing the current PyTorch confidence levels, digital twin sensor arrays, and trending deltas.
*   **GET /api/v1/lightcurve**: Triggers a backend Matplotlib generation script that mathematically pads logarithmic Y-axes (plt.ylim()) to prevent high-amplitude soft-curve clipping, and streams the image buffer directly to the client.

---

## 5. Deployment and Hosting

To ensure accessibility and reliability during the evaluation phase, the system has been migrated from local testing to a production-grade cloud environment:
*   **Server Hosting:** Render.com (Web Services, Python 3 environment).
*   **Mobile Distribution:** Expo Application Services (EAS) utilized to compile a native Android Application Package (APK) for direct hardware installation, circumventing the Google Play Store sandbox.
*   **Version Control:** Hosted on GitHub, enabling CI/CD pipelines for automated redeployments upon repository mutation.

---

## 6. Conclusion
SolarSim demonstrates a cohesive fusion of modern deep learning and distributed systems engineering. By treating space weather forecasting not just as a data science problem, but as a full-stack engineering challenge, this project successfully delivers actionable, real-time intelligence to end-users with zero localized computational overhead.



---

## 7. ISRO BAH 2026 - Idea Submission Presentation Mapping
This section maps the official presentation template slides directly to our implementation to assist the team in generating the final pitch deck.

### Slide 1 & 2: Team Introduction
*   **Team Name:** [Your Team Name]
*   **Problem Statement:** 15: Forecasting and Now-casting of Solar Flares
*   **Team Leader & Members:** [List your team members and colleges]

### Slide 3: Opportunity & USP
*   **How different is it:** Most existing systems rely on slow, monolithic terrestrial supercomputers that update every 6 hours. SolarSim brings predictions directly to edge devices (mobile phones) via a lightweight Digital Twin and an API that operates continuously with zero manual intervention.
*   **How it solves the problem:** By constantly ingesting proxy telemetry and passing it through our pre-trained LSTM, we can predict flare anomalies minutes before peak X-ray flux hits Earth, protecting satellite electronics.
*   **USP (Unique Selling Proposition):** 
    1. Real-time Digital Twin simulation of Aditya-L1 data.
    2. Zero-latency mobile monitoring app built in React Native.
    3. Fully automated 24/7 cloud backend.

### Slide 4: List of Features
*   **Live Telemetry Dashboard:** Displays simulated SWIS and PAPA sensor data natively on iOS and Android.
*   **Flare Probability Engine:** Machine Learning probability gauge constantly evaluating risk from 0% to 100%.
*   **Interactive Lightcurves:** Rendered 300 DPI Matplotlib graphs streamed dynamically to the app.
*   **Resilient Connectivity:** Auto-reconnecting fallback architecture.

### Slide 5 & 7: Process Flow & Architecture
*   *(Use the details from Section 2 of this README)*
*   **Data Source:** NOAA GOES-16 proxy -> **Cloud:** Render FastAPI backend -> **Inference:** PyTorch LSTM -> **Client:** Expo React Native App.

### Slide 6: Wireframes / Mock diagrams
*   *(Insert screenshots of the beautifully styled Dark Mode React Native App you built, highlighting the green Nominal states and red Anomaly states).*

### Slide 8: Technologies Used
*   **Machine Learning:** PyTorch, Pandas, Numpy, Scikit-Learn.
*   **Backend Engineering:** Python, FastAPI, Uvicorn, Matplotlib.
*   **Mobile Frontend:** React Native, Expo, TypeScript, Axios.
*   **Deployment Operations:** Render.com, Expo Application Services (EAS), GitHub CI/CD.

### Slide 9: Estimated Implementation Cost
*   **Current Cost:** .00 (Hosted entirely on Render Free Tier and Expo EAS Free Tier during prototyping).
*   **Production Scaling:** ~/month for dedicated AWS EC2/Render instances and increased NOAA API rate-limiting thresholds.

