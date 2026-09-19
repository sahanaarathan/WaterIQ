import numpy as np
import pandas as pd
import os

np.random.seed(42)

N = 5000

ph = np.random.normal(7.2, 0.7, N)
turbidity = np.random.gamma(2, 1.8, N)
tds = np.random.normal(450, 120, N)
temperature = np.random.normal(27, 4, N)
conductivity = np.random.normal(700, 180, N)
flow_rate = np.random.normal(50, 8, N)
pressure = np.random.normal(3.2, 0.5, N)

# Keep values realistic
ph = np.clip(ph, 4, 10)
turbidity = np.clip(turbidity, 0.1, 20)
tds = np.clip(tds, 50, 1000)
temperature = np.clip(temperature, 10, 45)
conductivity = np.clip(conductivity, 100, 1500)
flow_rate = np.clip(flow_rate, 10, 100)
pressure = np.clip(pressure, 1, 6)

# Water quality risk
quality_risk = (
    (abs(ph - 7) > 1.0)
    | (turbidity > 5)
    | (tds > 700)
    | (conductivity > 1000)
)

water_quality = np.where(
    quality_risk,
    "WARNING",
    "SAFE"
).astype(object)

# Critical conditions
critical = (
    (ph < 5.5)
    | (ph > 9)
    | (turbidity > 10)
    | (tds > 900)
)

water_quality[critical] = "CRITICAL"

# Leak simulation
leak_probability = (
    (flow_rate > 65)
    | (pressure < 2.2)
)

leak_status = np.where(
    leak_probability,
    "LEAK",
    "NORMAL"
)

df = pd.DataFrame({
    "ph": ph,
    "turbidity": turbidity,
    "tds": tds,
    "temperature": temperature,
    "conductivity": conductivity,
    "flow_rate": flow_rate,
    "pressure": pressure,
    "water_quality": water_quality,
    "leak_status": leak_status
})

os.makedirs("data", exist_ok=True)

df.to_csv("data/water_data.csv", index=False)

print("Dataset generated successfully!")
print(f"Rows: {len(df)}")
print("\nWater Quality:")
print(df["water_quality"].value_counts())

print("\nLeak Status:")
print(df["leak_status"].value_counts())