import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from Sam import SAMDataProcessor
from dsbs_scraper import DSBSDataScraper

app = Flask(__name__)

API_KEY = "1N3Uevlh2s2CFCOcO2Da2pgSEpC5oesbzXDwEVxp"  # Example key

# CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": ["https://samapipull.netlify.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Add a root route
@app.route('/', methods=['GET'])
def home():
    response = make_response(jsonify({"message": "SAM.gov API Server is running!"}))
    response.headers.add("Access-Control-Allow-Origin", "https://samapipull.netlify.app")
    return response

@app.route('/process-sam-data', methods=['POST'])
def process_sam_data():
    params = request.json
    API_KEY = "1N3Uevlh2s2CFCOcO2Da2pgSEpC5oesbzXDwEVxp"  # Example key
    
    # If it's a business name search
    if 'legalBusinessName' in params:
        search_params = {
            'legalBusinessName': params['legalBusinessName'],
            'registrationStatus': 'A'  # Keep active status filter
        }
    # If it's a UEI search
    elif 'ueiSAM' in params:
        search_params = {
            'ueiSAM': params['ueiSAM'],
            'registrationStatus': 'A'  # Keep active status filter
        }
    # If it's a CAGE search
    elif 'cageCode' in params:
        search_params = {
            'cageCode': params['cageCode'],
            'registrationStatus': 'A'  # Keep active status filter
        }
    # If it's a Naics search
    elif 'naicsCode' in params:
        search_params = {
            'naicsCode': params['naicsCode'],
            'registrationStatus': 'A'  # Keep active status filter
        }
    # If it's a socio-economic search
    else:
        search_params = {
            'registrationStatus': params.get('registrationStatus'),
            'physicalAddressProvinceOrStateCode': params.get('physicalAddressProvinceOrStateCode')
        }
        # If there's a query string, add it
        if 'q' in params:
            search_params['q'] = params['q']
            
        # Remove None values
        search_params = {k: v for k, v in search_params.items() if v is not None}
    
    try:
        processor = SAMDataProcessor(API_KEY)
        json_data = processor.download_and_process(search_params)
        return jsonify(json_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-dsbs-data', methods=['POST'])
def get_dsbs_data():
    data = request.json
    uei = data.get('uei')
    cage_code = data.get('cage_code')
    state = data.get('state')  # Add state parameter
    
    if not all([uei, cage_code, state]):
        return jsonify({'error': 'Must provide UEI, CAGE code, and state'}), 400
        
    try:
        scraper = DSBSDataScraper()
        contact_info = scraper.get_contact_info(uei=uei, cage_code=cage_code, state=state)
        return jsonify(contact_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)