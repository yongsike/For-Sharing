import os
import pandas as pd
import requests
import subprocess
import sys

# 1. Load configuration from .env.local
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    config = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    config[key] = value
    return config

def main():
    # Setup base directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    synth_dir = os.path.join(base_dir, 'synthetic data')
    
    config = load_env()
    supabase_url = config.get('VITE_SUPABASE_URL')
    supabase_key = config.get('VITE_SUPABASE_ANON_KEY')
    # Use SERVICE_ROLE_KEY if available for bypass RLS
    service_role_key = config.get('SUPABASE_SERVICE_ROLE_KEY') or supabase_key

    if not supabase_url or not supabase_key:
        print("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local")
        return

    # 2. Run dataGenerator.py
    print("--- 1. Generating new data ---")
    try:
        # Use the same python executable that is running this script
        generator_script = os.path.join(synth_dir, 'dataGenerator.py')
        subprocess.run([sys.executable, generator_script], check=True, cwd=base_dir)
    except subprocess.CalledProcessError as e:
        print(f"Error running dataGenerator.py: {e}")
        return

    # 3. Define headers
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # 4. Clear existing data (in reverse order of dependencies)
    tables_to_clear = [
        "investment_valuations",
        "insurance_valuations",
        "client_plans",
        "cashflow",
        "clients"
    ]

    print("\n--- 2. Clearing existing data in Supabase ---")
    for table in tables_to_clear:
        print(f"Clearing {table} table")
        # Use a broad filter to avoid 'delete without filter' restrictions
        filter_col = "client_id" if table in ["clients", "client_plans", "cashflow"] else "plan_id"
        
        del_url = f"{supabase_url}/rest/v1/{table}?{filter_col}=not.is.null"
        response = requests.delete(del_url, headers=headers)
        
        if response.status_code not in [200, 204]:
            print(f"Warning: Failed to clear {table}. Status: {response.status_code}")
            print(response.text)
            if "violates foreign key constraint" in response.text:
                print("Aborting due to constraint error.")
                return

    # 5. Populate tables with new data
    data_files = [
        ("clients", "clients.csv"),
        ("client_plans", "client_plans.csv"),
        ("cashflow", "cashflow.csv"),
        ("investment_valuations", "investment_valuations.csv"),
        ("insurance_valuations", "insurance_valuations.csv")
    ]

    print("\n--- 3. Repopulating Supabase tables ---")
    for table, file_name in data_files:
        file_path = os.path.join(synth_dir, file_name)
        if not os.path.exists(file_path):
            print(f"Error: {file_path} not found.")
            continue

        df = pd.read_csv(file_path)
        
        # Convert NaN to None for JSON serialization
        records = df.where(pd.notnull(df), None).to_dict(orient='records')
        
        url = f"{supabase_url}/rest/v1/{table}"
        response = requests.post(url, headers=headers, json=records)
        
        if response.status_code in [201, 200, 204]:
            print(f"Uploaded {len(records)} rows to {table}.")
        else:
            print(f"Error uploading to {table}. Status: {response.status_code}")
            print(response.text)
            return

    print("\n--- Database Repopulated! ---")

if __name__ == "__main__":
    main()
