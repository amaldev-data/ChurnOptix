from fastapi import FastAPI
import joblib
import pandas as pd

# Create FastAPI app
app = FastAPI()

# Load model
model = joblib.load(
    "models/churn_model.pkl"
)

@app.get("/")
def home():

    return {
        "message": "Customer Churn API Running"
    }


@app.get("/predict")
def predict():

    customer_data = {
        "gender": 1,
        "SeniorCitizen": 0,
        "Partner": 1,
        "Dependents": 0,
        "tenure": 2,
        "PhoneService": 1,
        "MultipleLines": 0,
        "InternetService": 1,
        "OnlineSecurity": 0,
        "OnlineBackup": 0,
        "DeviceProtection": 0,
        "TechSupport": 0,
        "StreamingTV": 1,
        "StreamingMovies": 1,
        "Contract": 0,
        "PaperlessBilling": 1,
        "PaymentMethod": 2,
        "MonthlyCharges": 95.5,
        "TotalCharges": 191.0
    }

    customer_df = pd.DataFrame(
        [customer_data]
    )

    prediction = model.predict(
        customer_df
    )[0]

    probability = model.predict_proba(
        customer_df
    )[0][1]

    return {
        "prediction": int(prediction),
        "churn_probability": float(probability)
    }