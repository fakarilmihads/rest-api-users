import pandas as pd
import json
from pymongo import MongoClient


json_file = "D:/RWID/rest-api-users/mock_data.json"

client = MongoClient("mongodb://localhost:27017/")
db = client["mockdata"] 
collection = db["sectors"]

with open(json_file, "r") as file:
    data = [json.loads(line) for line in file]

if data:
    collection.insert_many(data)
    print(f"✅ {len(data)} records inserted into MongoDB!")

else:
    print("❌ No data found in JSON file.")
