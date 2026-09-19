import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("data/water_data.csv")

# =========================================================
# WATER QUALITY MODEL
# =========================================================

quality_features = [
    "ph",
    "turbidity",
    "tds",
    "temperature",
    "conductivity"
]

X_quality = df[quality_features]
y_quality = df["water_quality"]

X_train, X_test, y_train, y_test = train_test_split(
    X_quality,
    y_quality,
    test_size=0.2,
    random_state=42,
    stratify=y_quality
)

quality_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=42,
    class_weight="balanced"
)

quality_model.fit(X_train, y_train)

quality_predictions = quality_model.predict(X_test)

quality_accuracy = accuracy_score(
    y_test,
    quality_predictions
)

print("\n================================")
print("WATER QUALITY MODEL")
print("================================")
print(f"Accuracy: {quality_accuracy * 100:.2f}%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        quality_predictions
    )
)

# =========================================================
# LEAK DETECTION MODEL
# =========================================================

leak_features = [
    "flow_rate",
    "pressure"
]

X_leak = df[leak_features]
y_leak = df["leak_status"]

X_train, X_test, y_train, y_test = train_test_split(
    X_leak,
    y_leak,
    test_size=0.2,
    random_state=42,
    stratify=y_leak
)

leak_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42,
    class_weight="balanced"
)

leak_model.fit(X_train, y_train)

leak_predictions = leak_model.predict(X_test)

leak_accuracy = accuracy_score(
    y_test,
    leak_predictions
)

print("\n================================")
print("LEAK DETECTION MODEL")
print("================================")
print(f"Accuracy: {leak_accuracy * 100:.2f}%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        leak_predictions
    )
)

# =========================================================
# SAVE MODELS
# =========================================================

os.makedirs("models", exist_ok=True)

joblib.dump(
    quality_model,
    "models/water_quality_model.pkl"
)

joblib.dump(
    leak_model,
    "models/leak_detection_model.pkl"
)

print("\n================================")
print("MODELS SAVED SUCCESSFULLY")
print("================================")
print("✓ models/water_quality_model.pkl")
print("✓ models/leak_detection_model.pkl")