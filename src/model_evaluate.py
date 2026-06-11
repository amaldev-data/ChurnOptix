# Import libraries
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

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
os.makedirs("reports", exist_ok=True)

print("=" * 50)
print("MODEL EVALUATION")
print("=" * 50)

# Load processed data
X_train, X_test, y_train, y_test = load_and_preprocess_data()

# Load saved model
model = joblib.load("models/churn_model.pkl")

# Make predictions
y_pred = model.predict(X_test)

# Prediction probabilities
y_prob = model.predict_proba(X_test)[:, 1]

# -----------------------------
# Accuracy
# -----------------------------
accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:")
print(round(accuracy, 4))

# -----------------------------
# Classification Report
# -----------------------------
report = classification_report(
    y_test,
    y_pred
)

print("\nClassification Report:")
print(report)

# Save report
with open(
    "reports/classification_report.txt",
    "w"
) as f:

    f.write(report)

# -----------------------------
# ROC-AUC Score
# -----------------------------
roc_score = roc_auc_score(
    y_test,
    y_prob
)

print("\nROC-AUC Score:")
print(round(roc_score, 4))

# Save metrics
with open(
    "reports/model_metrics.txt",
    "w"
) as f:

    f.write(f"Accuracy : {accuracy:.4f}\n")
    f.write(f"ROC-AUC  : {roc_score:.4f}\n")

# -----------------------------
# Confusion Matrix
# -----------------------------
cm = confusion_matrix(
    y_test,
    y_pred
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
    "reports/confusion_matrix.png"
)

plt.show()

# -----------------------------
# ROC Curve
# -----------------------------
fpr, tpr, thresholds = roc_curve(
    y_test,
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
    "reports/roc_curve.png"
)

plt.show()

# -----------------------------
# Feature Importance
# -----------------------------
if hasattr(model, "feature_importances_"):

    feature_importance = pd.DataFrame({
        "Feature": X_train.columns,
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
        "reports/feature_importance.csv",
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
        "reports/feature_importance.png"
    )

    plt.show()

print("\nReports Generated Successfully!")

print("\nSaved Files:")

print("reports/classification_report.txt")
print("reports/model_metrics.txt")
print("reports/confusion_matrix.png")
print("reports/roc_curve.png")
print("reports/feature_importance.csv")
print("reports/feature_importance.png")