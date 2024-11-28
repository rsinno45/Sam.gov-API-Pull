import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from Sam import SAMDataProcessor

app = Flask(__name__)

# Enable CORS for all routes with specific configurations
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["OPTIONS", "GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

@app.route('/process-sam-data', methods=['POST', 'OPTIONS'])
def process_sam_data():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    api_key = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle"
    processor = SAMDataProcessor(api_key)
    
    try:
        params = request.get_json()
        print("Received parameters:", params)
        
        json_data = processor.download_and_process(params)
        response = make_response(jsonify(json_data))
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        error_response = make_response(jsonify({'error': str(e)}), 500)
        error_response.headers.add("Access-Control-Allow-Origin", "*")
        return error_response

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port)

