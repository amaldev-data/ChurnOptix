from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

# =====================================================
# CREATE FASTAPI APP
# =====================================================
app = FastAPI(
    title="Customer Churn Prediction API",
    version="1.0"
)

# =====================================================
# LOAD MODEL & PIPELINE
# =====================================================
model = joblib.load("models/churn_model.pkl")
preprocessor = joblib.load("models/preprocessor.pkl")
feature_columns = joblib.load("models/feature_columns.pkl")

# =====================================================
# REQUEST SCHEMA
# =====================================================
class CustomerData(BaseModel):
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float

# =====================================================
# HOME ENDPOINT
# =====================================================
@app.get("/")
def home():
    return {
        "message": "Customer Churn API Running Successfully"
    }

# =====================================================
# PREDICTION ENDPOINT
# =====================================================
@app.post("/predict")
def predict(customer: CustomerData):
    # Pydantic v2 uses model_dump() instead of dict()
    input_data = customer.model_dump()
    
    # Convert input to DataFrame
    raw_df = pd.DataFrame([input_data])
    
    # Enforce exact raw feature alignment/ordering before preprocessing
    raw_features = [
        "gender", "SeniorCitizen", "Partner", "Dependents", "tenure",
        "PhoneService", "MultipleLines", "InternetService", "OnlineSecurity",
        "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV",
        "StreamingMovies", "Contract", "PaperlessBilling", "PaymentMethod",
        "MonthlyCharges", "TotalCharges"
    ]
    raw_df = raw_df[raw_features]
    
    # Preprocess the data using the saved pipeline
    processed_features = preprocessor.transform(raw_df)
    
    # Convert back to DataFrame matching the feature naming and order expected by model
    processed_df = pd.DataFrame(processed_features, columns=feature_columns)
    
    # Generate prediction and probability
    prediction = model.predict(processed_df)[0]
    probability = model.predict_proba(processed_df)[0][1]
    
    return {
        "prediction": str(prediction),
        "churn_probability_percentage": float(probability) * 100
    }