import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

df = pd.read_csv('hotel_bookings.csv')
df = df.loc[df.adults <10,:]
df = df.loc[df.children <10,:]
df = df.loc[df.babies <9,:]
df = df[~df['children'].isna()]
df = df[~df['country'].isna()]
df = df[~df['babies'].isna()]
df['kids'] = df['babies'] + df['children']
df['kids_bool'] = df['kids'].apply(lambda x: 1 if x>0 else 0)
df['totalDays'] = df['stays_in_weekend_nights'] + df['stays_in_week_nights']
mapping = {
    'January': 1,
    'February': 2,
    'March': 3,
    'April': 4,
    'May': 5,
    'June': 6,
    'July': 7,
    'August': 8,
    'September': 9,
    'October': 10,
    'November': 11,
    'December': 12
}
df['arrival_date_month_num'] = df['arrival_date_month'].map(mapping)
df['arrival_date'] = df['arrival_date_day_of_month'].astype(str) + '-' + df['arrival_date_month_num'].astype(str) + '-' + df['arrival_date_year'].astype(str)
df['arrival_date'] = pd.to_datetime(df['arrival_date'], dayfirst=True)
df.to_csv('hotel_bookings_clean.csv', sep=';', index = False)
df.to_json('Visualizacion_PEC3/hotel_bookings_clean.json', index = False)
