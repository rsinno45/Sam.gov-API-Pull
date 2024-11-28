import requests
import pandas as pd
import json
import zipfile
import gzip
import io
import time
from typing import Dict, Any

class SAMDataProcessor:
    BASE_URL = "https://api.sam.gov/entity-information/v3/entities"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def get_download_url(self, params: Dict[Any, Any]) -> str:
        """Get the download URL for the ZIP file containing CSV data."""
        params.update({
            'api_key': self.api_key,
            'samRegistered': 'Yes',
            'format': 'csv'
        })
        
        response = requests.get(self.BASE_URL, params=params)
        response.raise_for_status()
        
        # Extract download URL from response
        download_url = response.text.replace("Extract File will be available for download with url: ", "")
        download_url = download_url.split("in some time")[0].strip()
        
        # If the URL contains REPLACE_WITH_API_KEY, replace it with the actual API key
        if "REPLACE_WITH_API_KEY" in download_url:
            download_url = download_url.replace("REPLACE_WITH_API_KEY", self.api_key)
        
        # If the URL contains api_key parameter, update it
        if "api_key=" in download_url:
            # Split URL at api_key parameter
            base_url, params = download_url.split("api_key=")
            # If there are more parameters after api_key
            if "&" in params:
                rest_params = params.split("&", 1)[1]
                download_url = f"{base_url}api_key={self.api_key}&{rest_params}"
            else:
                download_url = f"{base_url}api_key={self.api_key}"
        
        print(f"Download URL: {download_url}")  # Add this for debugging
        return download_url
        
    def download_and_process(self, params: Dict[Any, Any]) -> dict:
        """Download gzipped CSV file and convert to JSON."""
        
        
        # Get download URL
        download_url = self.get_download_url(params)
        
        # Wait for file to be ready
        time.sleep(5)
        
        # Download gzipped file
        response = requests.get(download_url)
        response.raise_for_status()
        
        # Process gzipped file
        with gzip.open(io.BytesIO(response.content)) as gz_file:
            # Read CSV directly from the gzipped file
            df = pd.read_csv(gz_file)
                
        # Convert DataFrame to JSON structure
        json_data = {
            "totalRecords": len(df),
            "entityData": json.loads(df.to_json(orient='records'))
        }
        
        return json_data


def main():
    # Example usage
    api_key = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle"
    processor = SAMDataProcessor(api_key)
    
    # Example search parameters
    params = {
        'businessTypeCode': '27',  # Small Disadvantaged Business
        'physicalAddressProvinceOrStateCode': 'CA',
        'registrationStatus': 'A'
    }
    
    try:
        # Get and process data
        json_data = processor.download_and_process(params)
        
        # Save to file
        with open('sam_data.json', 'w') as f:
            json.dump(json_data, f, indent=2)
            
        print(f"Successfully processed data. Total records: {json_data['totalRecords']}")
        
    except Exception as e:
        print(f"Error processing data: {e}")

if __name__ == "__main__":
    main()