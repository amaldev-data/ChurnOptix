import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def load_and_preprocess_data():

    # Load dataset
    df = pd.read_csv("data/churn_data.csv")

    print("\nOriginal Shape")
    print(df.shape)

    # Remove Customer ID
    df.drop("customerID", axis=1, inplace=True)

    # Check duplicates
    print("\nDuplicate Rows:")
    print(df.duplicated().sum())

    # Fix TotalCharges
    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"],
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

    # Find categorical columns
    categorical_columns = df.select_dtypes(
        include="object"
    ).columns

    # Encode categories
    encoder = LabelEncoder()

    for col in categorical_columns:
        df[col] = encoder.fit_transform(df[col])

    # Save processed dataset
    df.to_csv(
        "data/processed_churn_data.csv",
        index=False
    )

    print("\nProcessed Dataset Saved")

    # Features and Target
    X = df.drop("Churn", axis=1)
    y = df["Churn"]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42
    )

    print("\nTrain Shape:", X_train.shape)
    print("Test Shape:", X_test.shape)

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":

    load_and_preprocess_data()