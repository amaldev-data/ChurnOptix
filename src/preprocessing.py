from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_and_preprocess_data(raw: bool = False):
    """
    Load and clean churn dataset.
    
    Parameters:
        raw (bool): If True, returns raw unencoded features (useful when feeding
                    into a downstream ColumnTransformer/pipeline).
                    If False, returns features encoded with OrdinalEncoder and
                    target encoded with LabelEncoder.
    
    Returns:
        X_train, X_test, y_train, y_test
    """
    # Load dataset
    df = pd.read_csv(DATA_DIR / "churn_data.csv")

    print("\nOriginal Shape")
    print(df.shape)

    # Remove Customer ID
    df.drop("customerID", axis=1, inplace=True, errors="ignore")

    # Check duplicates
    print("\nDuplicate Rows:")
    print(df.duplicated().sum())

    # Fix TotalCharges: blank strings to numeric, impute with median
    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"].replace(" ", None) if isinstance(df["TotalCharges"].dtype, object) else df["TotalCharges"],
        errors="coerce"
    )

    # Missing values
    print("\nMissing Values Before Cleaning")
    print(df.isnull().sum())

    # Fill missing values
    df["TotalCharges"] = df["TotalCharges"].fillna(
        df["TotalCharges"].median()
    )

    print("\nMissing Values After Cleaning")
    print(df.isnull().sum())

    # Features and Target separation
    X = df.drop("Churn", axis=1)
    y = df["Churn"]

    # Target encoding using LabelEncoder (intended for 1D target arrays)
    target_encoder = LabelEncoder()
    y_encoded = pd.Series(target_encoder.fit_transform(y), name="Churn", index=df.index)

    if raw:
        # Split raw features with raw target
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )
        print("\nTrain Shape (raw):", X_train.shape)
        print("Test Shape (raw):", X_test.shape)
        return X_train, X_test, y_train, y_test

    # Encode categorical feature matrix using OrdinalEncoder (not single LabelEncoder in loop)
    categorical_columns = X.select_dtypes(
        include=["object", "bool"]
    ).columns.tolist()

    if categorical_columns:
        feature_encoder = OrdinalEncoder()
        X[categorical_columns] = feature_encoder.fit_transform(X[categorical_columns])

    # Save processed dataset
    processed_df = X.copy()
    processed_df["Churn"] = y_encoded
    processed_df.to_csv(
        DATA_DIR / "processed_churn_data.csv",
        index=False
    )

    print("\nProcessed Dataset Saved")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded
    )

    print("\nTrain Shape:", X_train.shape)
    print("Test Shape:", X_test.shape)

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    load_and_preprocess_data()