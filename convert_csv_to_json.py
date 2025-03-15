import pandas as pd
import os

base_dir = "D:/RWID/rest-api-users/"

csv_file = os.path.join(base_dir, "Mock Data 2.csv") 
json_file = os.path.join(base_dir, "mock_data.json") 


try:
    df = pd.read_csv(csv_file)
    
    df.to_json(json_file, orient="records", lines=True)
    
    print(f"✅ Konversi selesai! File JSON disimpan di: {json_file}")
except Exception as e:
    print(f"❌ Gagal mengonversi CSV ke JSON: {e}")
