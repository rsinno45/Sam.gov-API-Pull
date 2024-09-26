class SamGovAPI {
  static BASE_URL = "https://api.sam.gov/entity-information/v3/entities?";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getPublicData(params = {}) {
    params.api_key = this.apiKey;
    params.samRegistered = "Yes";
    params.format = "csv"; // Request CSV format

    const response = await axios.get(SamGovAPI.BASE_URL, { params });
    return this._handleResponse(response);
  }

  _handleResponse(response) {
    if (response.status === 200) {
      return response.data; // Return CSV content as text
    } else {
      throw new Error(`Error: ${response.status} - ${response.data}`);
    }
  }
}

// Usage
async function fetchData() {
  const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle"; // Your actual API key
  const samApi = new SamGovAPI(apiKey);

  const physicalAddressCity = document
    .getElementById("physicalAddressCity")
    .value.trim(); // Get input value and trim whitespace

  // Validate the input
  if (!validateInput(physicalAddressCity)) {
    document.getElementById("output").textContent =
      "Please enter a valid city.";
    return; // Exit the function if validation fails
  }

  const businessTypeCode = document
    .getElementById("socioEconomicDesignations")
    .value.trim(); // Get input value and trim whitespace
  console.log(businessTypeCode);

  // Validate the input
  if (!validateInput(businessTypeCode)) {
    document.getElementById("output").textContent =
      "Please enter a valid designation.";
    return; // Exit the function if validation fails
  }

  const socioEconomicParams = {
    businessTypeCode: businessTypeCode, // Keep this if you need it, or adjust as necessary
    physicalAddressCity: physicalAddressCity, // Use the input value
  };

  try {
    const response = await samApi.getPublicData(socioEconomicParams); // Get the response
    const downloadUrl = response
      .replace("REPLACE_WITH_API_KEY", apiKey) // Replace the placeholder with the actual API key
      .replace("Extract File will be available for download with url: ", "") // Remove the unwanted phrase
      .replace(
        "in some time. If you have requested for an email notification, you will receive it once the file is ready for download.",
        ""
      ); // Remove the unwanted phrase

    // **NEW CODE**: Split the URL into two parts
    const tokenIndex = downloadUrl.indexOf("token=");
    if (tokenIndex !== -1) {
      const firstPart = downloadUrl.substring(0, tokenIndex + 6); // Include "token="
      const secondPart = downloadUrl.substring(tokenIndex + 6); // Everything after the token value

      // **NEW CODE**: Create a formatted output without the initial phrase
      const outputHtml = `
        
        <a id="output-style" href="${downloadUrl}" target="_blank">Click Here To Download CSV</a>
      `;

      document.getElementById("output").innerHTML = outputHtml; // Use innerHTML to render HTML
    } else {
      document.getElementById("output").textContent =
        "Token not found in the URL.";
    }
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
  }
}

// Validation function
function validateInput(input) {
  // Check if the input is not empty and is a valid string (you can add more checks if needed)
  return input.length > 0;
}

// Attach event listener to button
document.getElementById("fetchDataButton").onclick = fetchData; // Call fetchData when button is clicked
