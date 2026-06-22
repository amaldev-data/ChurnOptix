import mlflow
import mlflow.sklearn
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import os

os.makedirs("mlruns", exist_ok=True)

mlflow.set_tracking_uri("file:./mlruns")
import os

os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"
print("Tracking URI:", mlflow.get_tracking_uri())
# Start MLflow experiment
mlflow.set_experiment(
    "Customer Churn Prediction"
)

# Load dataset
df = pd.read_csv(
    "data/churn_data.csv"
)

# Encode categorical columns
categorical_cols = df.select_dtypes(
    include=["object"]
).columns

encoder = LabelEncoder()

for col in categorical_cols:

    df[col] = encoder.fit_transform(
        df[col]
    )

# Features and Target
X = df.drop(
    "Churn",
    axis=1
)

y = df["Churn"]

# Split Data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
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
