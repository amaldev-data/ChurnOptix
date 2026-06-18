import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder, StandardScaler

# =====================================================
# LOAD DATA
# =====================================================
df = pd.read_csv("data/churn_data.csv")

# Fix Telco Churn specific quirk: Handle blank spaces in TotalCharges
if "TotalCharges" in df.columns:
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"].replace(" ", "0"))

# Drop ID and separate features from target
X = df.drop(["customerID", "Churn"], axis=1, errors="ignore")
y = df["Churn"].map({"Yes": 1, "No": 0}) if df["Churn"].dtype == "object" else df["Churn"]

# =====================================================
# DYNAMIC PREPROCESSING SETUP
# =====================================================
# Identify column types automatically
categorical_cols = X.select_dtypes(include=["object", "bool"]).columns.tolist()
numeric_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

# Define the preprocessor pipeline
preprocessor = ColumnTransformer(
    transformers=[
        # Encode all text/boolean variables consistently
        ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical_cols),
        # Scale numeric features (highly recommended for Logistic Regression)
        ("num", StandardScaler(), numeric_cols),
    ],
    remainder="passthrough"
)

# =====================================================
# TRAIN TEST SPLIT
# =====================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# Fit the preprocessor on training data and transform both sets
X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

# Convert back to DataFrame to preserve column reference order easily
feature_names = categorical_cols + numeric_cols
X_train_df = pd.DataFrame(X_train_processed, columns=feature_names)
X_test_df = pd.DataFrame(X_test_processed, columns=feature_names)

print(f"\nFeature Count: {X_train_df.shape[1]}")

# =====================================================
# LOGISTIC REGRESSION
# =====================================================
log_model = LogisticRegression(max_iter=1000)
log_model.fit(X_train_df, y_train)
y_pred_log = log_model.predict(X_test_df)

print("\nLogistic Regression Performance:")
print(f"Accuracy: {accuracy_score(y_test, y_pred_log):.4f}")
print(confusion_matrix(y_test, y_pred_log))
print(classification_report(y_test, y_pred_log))

# =====================================================
# RANDOM FOREST
# =====================================================
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_df, y_train)
y_pred_rf = rf_model.predict(X_test_df)

print("\nRandom Forest Performance:")
print(f"Accuracy: {accuracy_score(y_test, y_pred_rf):.4f}")

# =====================================================
# SAVE MODELS AND PREPROCESSOR
# =====================================================
# Save the superior model (assuming RF performs better)
joblib.dump(rf_model, "models/churn_model.pkl")

# CRITICAL: Save the preprocessor so your API can transform raw data strings!
joblib.dump(preprocessor, "models/preprocessor.pkl")

# Save exact feature order expected by the model
joblib.dump(feature_names, "models/feature_columns.pkl")

print("\nAll artifacts saved successfully!")