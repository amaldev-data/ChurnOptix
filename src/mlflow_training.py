import os
from pathlib import Path
import mlflow
import mlflow.sklearn
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

BASE_DIR = Path(__file__).resolve().parent.parent
MLRUNS_DIR = BASE_DIR / "mlruns"
DATA_PATH = BASE_DIR / "data" / "churn_data.csv"

MLRUNS_DIR.mkdir(parents=True, exist_ok=True)
mlflow.set_tracking_uri(MLRUNS_DIR.as_uri())
os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"
print("Tracking URI:", mlflow.get_tracking_uri())

# Start MLflow experiment
mlflow.set_experiment(
    "Customer Churn Prediction"
)

# Load dataset
df = pd.read_csv(DATA_PATH)

# Fix Telco churn specific quirk: Convert blank strings in TotalCharges to numeric
if "TotalCharges" in df.columns:
    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"].replace(" ", "0"),
        errors="coerce"
    ).fillna(0)

# Drop customerID identifier to avoid overfitting
df.drop("customerID", axis=1, inplace=True, errors="ignore")

# Features and Target
X = df.drop("Churn", axis=1)
y = df["Churn"]

# Target encoding (1D target label)
target_encoder = LabelEncoder()
y_encoded = target_encoder.fit_transform(y)

# Categorical feature encoding using OrdinalEncoder (2D feature matrix)
categorical_cols = X.select_dtypes(
    include=["object", "bool"]
).columns.tolist()

if categorical_cols:
    feature_encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X[categorical_cols] = feature_encoder.fit_transform(X[categorical_cols])

# Split Data with stratification
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

# Start MLflow Run
with mlflow.start_run():

    # Model Parameters
    n_estimators = 100
    max_depth = 10

    # Create Model
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )

    # Train Model
    model.fit(
        X_train,
        y_train
    )

    # Predictions
    y_pred = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        y_pred
    )

    # Log Parameters
    mlflow.log_param(
        "n_estimators",
        n_estimators
    )

    mlflow.log_param(
        "max_depth",
        max_depth
    )

    # Log Metric
    mlflow.log_metric(
        "accuracy",
        accuracy
    )

    # Log Model
    mlflow.sklearn.log_model(
        model,
        "random_forest_model"
    )

    print(
        f"Accuracy: {accuracy:.4f}"
    )

print(
    "MLflow Tracking Completed"
)
