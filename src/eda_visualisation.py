import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
df = pd.read_csv("data/churn_data.csv")

# Dataset preview
print(df.head())

# Churn distribution
print(df["Churn"].value_counts())

# Churn count plot
sns.countplot(x="Churn", data=df)
plt.title("Customer Churn Distribution")
plt.show()

# Gender vs churn
sns.countplot(x="gender", hue="Churn", data=df)
plt.title("Gender vs Churn")
plt.show()

# Tenure distribution
plt.figure(figsize=(10,5))
sns.histplot(df["tenure"], bins=30)
plt.title("Customer Tenure Distribution")
plt.show()

# Monthly charges distribution
plt.figure(figsize=(10,5))
sns.histplot(df["MonthlyCharges"], bins=30)
plt.title("Monthly Charges Distribution")
plt.show()

# Contract type vs churn
sns.countplot(x="Contract", hue="Churn", data=df)
plt.title("Contract Type vs Churn")
plt.xticks(rotation=20)
plt.show()

# Payment method vs churn
plt.figure(figsize=(12,5))
sns.countplot(x="PaymentMethod", hue="Churn", data=df)
plt.title("Payment Method vs Churn")
plt.xticks(rotation=45)
plt.show()

# Correlation heatmap
numeric_df = df.select_dtypes(include=["int64", "float64"])

corr = numeric_df.corr()

plt.figure(figsize=(10,6))
sns.heatmap(corr, annot=True, cmap="coolwarm")

plt.title("Correlation Heatmap")
plt.show()


plt.savefig("models/churn_plot.png")