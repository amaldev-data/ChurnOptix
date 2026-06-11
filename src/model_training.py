import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report
)

# Load dataset
df = pd.read_csv("data/churn_data.csv")


# Preprocess data

# Convert boolean columns into integers
bool_cols = df.select_dtypes(include=["bool"]).columns

for col in bool_cols:
    df[col] = df[col].astype(int)

# Encode categorical columns
categorical_cols = df.select_dtypes(include=["object"]).columns

encoder = LabelEncoder()

for col in categorical_cols:
    df[col] = encoder.fit_transform(df[col])


# Features
X = df.drop(["customerID", "Churn"], axis=1)

# Target
y = df["Churn"]


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Create model
log_model = LogisticRegression(max_iter=1000)

# Train model
log_model.fit(X_train, y_train)

# Predictions
y_pred_log = log_model.predict(X_test)


# Accuracy
log_accuracy = accuracy_score(y_test, y_pred_log)

print("Logistic Regression Accuracy:", log_accuracy)

# Confusion matrix
cm = confusion_matrix(y_test, y_pred_log)

print(cm)

# Classification report
print(classification_report(y_test, y_pred_log))
# Create model
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)

# Train model
rf_model.fit(X_train, y_train)

# Predictions
y_pred_rf = rf_model.predict(X_test)

# Accuracy
rf_accuracy = accuracy_score(y_test, y_pred_rf)

print("Model Comparison")

print("Logistic Regression:", log_accuracy)
print("Random Forest:", rf_accuracy)

# Save trained model
joblib.dump(rf_model, "models/churn_model.pkl")

print("Model saved successfully")