import sys
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Paths setup
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"
SRC_DIR = BASE_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# Sklearn metrics
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)

# Import preprocessing function
from preprocessing import load_and_preprocess_data

# Create reports folder if not exists
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 50)
print("MODEL EVALUATION")
print("=" * 50)

# Load saved model, ColumnTransformer preprocessor, and feature column ordering
model = joblib.load(MODELS_DIR / "churn_model.pkl")
preprocessor = joblib.load(MODELS_DIR / "preprocessor.pkl")
feature_columns = joblib.load(MODELS_DIR / "feature_columns.pkl")

# Load raw test data (unencoded & unscaled) using the same stratified split
X_train_raw, X_test_raw, y_train, y_test = load_and_preprocess_data(raw=True)

# Transform test data using the trained ColumnTransformer to guarantee correct scale and ordering
X_test_processed = preprocessor.transform(X_test_raw)
X_test = pd.DataFrame(X_test_processed, columns=feature_columns)

# Make predictions
y_pred = model.predict(X_test)

# Prediction probabilities (probability of positive/churn class)
y_prob = model.predict_proba(X_test)[:, 1]

# Harmonize label types if model was trained with numeric labels vs string labels
if isinstance(model.classes_[0], str) and not isinstance(y_test.iloc[0], str):
    y_test_eval = y_test.map({1: "Yes", 0: "No"})
elif not isinstance(model.classes_[0], str) and isinstance(y_test.iloc[0], str):
    y_test_eval = (y_test == "Yes").astype(int)
else:
    y_test_eval = y_test

# Binary target indicator for ROC-AUC
if isinstance(y_test.iloc[0], str):
    y_test_binary = (y_test == "Yes").astype(int)
else:
    y_test_binary = y_test

# Determine evaluation labels
eval_labels = ["No", "Yes"] if isinstance(model.classes_[0], str) else [0, 1]

# -----------------------------
# Accuracy
# -----------------------------
accuracy = accuracy_score(y_test_eval, y_pred)

print("\nModel Accuracy:")
print(round(accuracy, 4))

# -----------------------------
# Classification Report
# -----------------------------
report = classification_report(
    y_test_eval,
    y_pred,
    labels=eval_labels
)

print("\nClassification Report:")
print(report)

# Save report
with open(
    REPORTS_DIR / "classification_report.txt",
    "w"
) as f:

    f.write(report)

# -----------------------------
# ROC-AUC Score
# -----------------------------
roc_score = roc_auc_score(
    y_test_binary,
    y_prob
)

print("\nROC-AUC Score:")
print(round(roc_score, 4))

# Save metrics
with open(
    REPORTS_DIR / "model_metrics.txt",
    "w"
) as f:

    f.write(f"Accuracy : {accuracy:.4f}\n")
    f.write(f"ROC-AUC  : {roc_score:.4f}\n")

# -----------------------------
# Confusion Matrix
# -----------------------------
cm = confusion_matrix(
    y_test_eval,
    y_pred,
    labels=eval_labels
)

print("\nConfusion Matrix:")
print(cm)

plt.figure(figsize=(6, 4))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["No Churn", "Churn"],
    yticklabels=["No Churn", "Churn"]
)

plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.tight_layout()

plt.savefig(
    REPORTS_DIR / "confusion_matrix.png"
)

plt.close()

# -----------------------------
# ROC Curve
# -----------------------------
fpr, tpr, thresholds = roc_curve(
    y_test_binary,
    y_prob
)

plt.figure(figsize=(6, 4))

plt.plot(
    fpr,
    tpr,
    label=f"ROC Curve (AUC = {roc_score:.2f})"
)

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--"
)

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")

plt.legend()

plt.tight_layout()

plt.savefig(
    REPORTS_DIR / "roc_curve.png"
)

plt.close()

# -----------------------------
# Feature Importance
# -----------------------------
if hasattr(model, "feature_importances_"):

    feature_importance = pd.DataFrame({
        "Feature": feature_columns,
        "Importance": model.feature_importances_
    })

    feature_importance = feature_importance.sort_values(
        by="Importance",
        ascending=False
    )

    print("\nTop 10 Feature Importance:")
    print(feature_importance.head(10))

    # Save CSV
    feature_importance.to_csv(
        REPORTS_DIR / "feature_importance.csv",
        index=False
    )

    # Plot
    plt.figure(figsize=(10, 6))

    sns.barplot(
        data=feature_importance.head(10),
        x="Importance",
        y="Feature"
    )

    plt.title("Top 10 Important Features")

    plt.tight_layout()

    plt.savefig(
        REPORTS_DIR / "feature_importance.png"
    )

    plt.close()

print("\nReports Generated Successfully!")

print("\nSaved Files:")

print(f"{REPORTS_DIR / 'classification_report.txt'}")
print(f"{REPORTS_DIR / 'model_metrics.txt'}")
print(f"{REPORTS_DIR / 'confusion_matrix.png'}")
print(f"{REPORTS_DIR / 'roc_curve.png'}")
print(f"{REPORTS_DIR / 'feature_importance.csv'}")
print(f"{REPORTS_DIR / 'feature_importance.png'}")