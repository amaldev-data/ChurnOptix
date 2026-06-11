import pandas as pd

df = pd.read_csv('data/churn_data.csv')
print(df.head())
print(df.shape)
print(df.columns)
print(df.info())
print(df.isnull().sum())
print(df.describe())

print(df['Churn'].value_counts())
df.to_csv('data/cleaned_churn_data.csv', index=False)