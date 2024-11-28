import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from Sam import SAMDataProcessor

app = Flask(__name__)

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

@app.route('/process-sam-data', methods=['POST', 'OPTIONS'])
def process_sam_data():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "https://samapipull.netlify.app")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response, 200

    api_key = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle"
    processor = SAMDataProcessor(api_key)
    
    try:
        params = request.json
        print("Received parameters:", params)
        
        json_data = processor.download_and_process(params)
        response = make_response(jsonify(json_data))
        response.headers.add("Access-Control-Allow-Origin", "https://samapipull.netlify.app")
        return response
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        error_response = make_response(jsonify({'error': str(e)}), 500)
        error_response.headers.add("Access-Control-Allow-Origin", "https://samapipull.netlify.app")
        return error_response

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)