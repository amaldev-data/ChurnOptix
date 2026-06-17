import streamlit as st
import requests
import pandas as pd
from datetime import datetime

# ==========================================================
# PAGE CONFIGURATION
# ==========================================================

st.set_page_config(
    page_title="Customer Churn Prediction Dashboard",
    page_icon="📊",
    layout="wide"
)

# ==========================================================
# PAGE TITLE
# ==========================================================

st.title("📊 Customer Churn Prediction Dashboard")

st.markdown(
    """
    Predict whether a telecom customer is likely to churn
    using a Machine Learning model deployed with FastAPI.
    """
)

# ==========================================================
# FASTAPI ENDPOINT
# ==========================================================

API_URL = "http://127.0.0.1:8000/predict"

# ==========================================================
# INPUT SECTION
# ==========================================================

st.subheader("📝 Customer Information")

col1, col2 = st.columns(2)

with col1:

    gender = st.selectbox(
        "Gender",
        ["Male", "Female"]
    )

    senior_citizen = st.selectbox(
        "Senior Citizen",
        ["No", "Yes"]
    )

    partner = st.selectbox(
        "Partner",
        ["No", "Yes"]
    )

    dependents = st.selectbox(
        "Dependents",
        ["No", "Yes"]
    )

    tenure = st.number_input(
        "Tenure (Months)",
        min_value=0,
        max_value=100,
        value=12,
        step=1
    )

    phone_service = st.selectbox(
        "Phone Service",
        ["No", "Yes"]
    )

    multiple_lines = st.selectbox(
        "Multiple Lines",
        ["No", "Yes"]
    )

    internet_service = st.selectbox(
        "Internet Service",
        ["No", "DSL", "Fiber optic"]
    )

    online_security = st.selectbox(
        "Online Security",
        ["No", "Yes"]
    )

with col2:

    online_backup = st.selectbox(
        "Online Backup",
        ["No", "Yes"]
    )

    device_protection = st.selectbox(
        "Device Protection",
        ["No", "Yes"]
    )

    tech_support = st.selectbox(
        "Tech Support",
        ["No", "Yes"]
    )

    streaming_tv = st.selectbox(
        "Streaming TV",
        ["No", "Yes"]
    )

    streaming_movies = st.selectbox(
        "Streaming Movies",
        ["No", "Yes"]
    )

    contract = st.selectbox(
        "Contract Type",
        ["Month-to-month", "One year", "Two year"]
    )

    paperless_billing = st.selectbox(
        "Paperless Billing",
        ["No", "Yes"]
    )

    payment_method = st.selectbox(
        "Payment Method",
        [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)"
        ]
    )

    monthly_charges = st.number_input(
        "Monthly Charges",
        min_value=0.0,
        value=70.05,
        step=0.01
    )

total_charges = st.number_input(
    "Total Charges",
    min_value=0.0,
    value=840.60,
    step=0.01
)

# ==========================================================
# PREPARE INPUT DATA
# ==========================================================

input_data = {
    "gender": gender,
    "SeniorCitizen": 1 if senior_citizen == "Yes" else 0,
    "Partner": partner,
    "Dependents": dependents,
    "tenure": int(tenure),
    "PhoneService": phone_service,
    "MultipleLines": "No phone service" if phone_service == "No" else multiple_lines,
    "InternetService": internet_service,
    "OnlineSecurity": "No internet service" if internet_service == "No" else online_security,
    "OnlineBackup": "No internet service" if internet_service == "No" else online_backup,
    "DeviceProtection": "No internet service" if internet_service == "No" else device_protection,
    "TechSupport": "No internet service" if internet_service == "No" else tech_support,
    "StreamingTV": "No internet service" if internet_service == "No" else streaming_tv,
    "StreamingMovies": "No internet service" if internet_service == "No" else streaming_movies,
    "Contract": contract,
    "PaperlessBilling": paperless_billing,
    "PaymentMethod": payment_method,
    "MonthlyCharges": float(monthly_charges),
    "TotalCharges": float(total_charges)
}

# ==========================================================
# PREDICT BUTTON
# ==========================================================

if st.button(
    "🔍 Predict Churn",
    use_container_width=True
):

    with st.spinner(
        "Communicating with FastAPI server..."
    ):

        try:

            response = requests.post(
                API_URL,
                json=input_data,
                timeout=10
            )

            if response.status_code == 200:

                result = response.json()

                prediction = result["prediction"]

                probability = float(
                    result["churn_probability_percentage"]
                )

                st.success(
                    "✅ Analysis Complete!"
                )

                st.caption(
                    f"Prediction Time: {datetime.now()}"
                )

                st.subheader(
                    "📈 Prediction Result"
                )

                if str(prediction).lower() == "yes":

                    prediction_text = "Likely To Churn"
                    confidence = probability

                    st.error(
                        "⚠️ Warning: Customer is likely to churn."
                    )

                else:

                    prediction_text = "Likely To Stay"
                    confidence = 100 - probability

                    st.success(
                        "✅ Good News: Customer is likely to stay."
                    )

                # ==================================================
                # KPI METRICS
                # ==================================================

                metric_col1, metric_col2 = st.columns(2)

                with metric_col1:

                    st.metric(
                        "Churn Probability",
                        f"{probability:.2f}%"
                    )

                with metric_col2:

                    st.metric(
                        "Prediction Confidence",
                        f"{confidence:.2f}%"
                    )

                # ==================================================
                # RISK LEVEL
                # ==================================================

                if probability < 50:

                    risk = "🟢 Low Risk"

                    recommendation = (
                        "Customer is currently unlikely to churn. "
                        "Continue maintaining customer satisfaction "
                        "through regular engagement and quality service."
                    )

                    st.success(
                        f"Risk Level: {risk}"
                    )

                elif probability < 75:

                    risk = "🟡 Medium Risk"

                    recommendation = (
                        "Customer shows some churn indicators. "
                        "Monitor customer engagement, offer loyalty "
                        "benefits, and provide personalized support."
                    )

                    st.warning(
                        f"Risk Level: {risk}"
                    )

                else:

                    risk = "🔴 High Risk"

                    recommendation = (
                        "High churn risk detected. "
                        "Immediate customer retention action is recommended. "
                        "Consider discounts, retention campaigns, or direct follow-up."
                    )

                    st.error(
                        f"Risk Level: {risk}"
                    )

                # ==================================================
                # RECOMMENDATION
                # ==================================================

                st.subheader(
                    "📌 Recommendation"
                )

                st.info(
                    recommendation
                )

                # ==================================================
                # SUMMARY TABLE
                # ==================================================

                summary_df = pd.DataFrame(
                    {
                        "Metric": [
                            "Customer Status",
                            "Churn Probability",
                            "Prediction Confidence",
                            "Risk Level"
                        ],
                        "Value": [
                            prediction_text,
                            f"{probability:.2f}%",
                            f"{confidence:.2f}%",
                            risk
                        ]
                    }
                )

                st.subheader(
                    "📋 Prediction Summary"
                )

                st.table(
                    summary_df
                )

                # ==================================================
                # DEBUG VIEW
                # ==================================================

                with st.expander(
                    "🔧 Developer Debug View"
                ):

                    st.write(
                        "Input Data Sent To API"
                    )

                    st.dataframe(
                        pd.DataFrame(
                            [input_data]
                        )
                    )

                    st.write(
                        "Total Features Sent"
                    )

                    st.success(
                        f"Total Count: {len(input_data)}"
                    )

            else:

                st.error(
                    f"API Error: {response.status_code}"
                )

                st.code(
                    response.text
                )

        except requests.exceptions.ConnectionError:

            st.error(
                "❌ Unable to connect to FastAPI server."
            )

            st.info(
                "Start FastAPI first:\n\n"
                "uvicorn app.main:app --reload"
            )

        except requests.exceptions.Timeout:

            st.error(
                "⌛ API request timed out."
            )

        except Exception as e:

            st.error(
                f"Unexpected Error: {str(e)}"
            )

# ==========================================================
# FOOTER
# ==========================================================

st.markdown("---")

st.caption(
    "Customer Churn MLOps Project | "
    "Python • Scikit-Learn • FastAPI • Streamlit"
)