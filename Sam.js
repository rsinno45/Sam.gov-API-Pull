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

  async getPublicDataJson(params = {}) {
    params.api_key = this.apiKey;
    params.samRegistered = "Yes";

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

  const primaryNaics = document.getElementById("primaryNaics").value.trim(); // Get input value and trim whitespace
  console.log(businessTypeCode);

  // Validate the input
  if (!validateInput(businessTypeCode)) {
    document.getElementById("output").textContent =
      "Please enter a valid code.";
    return; // Exit the function if validation fails
  }

  const socioEconomicParams = {
    businessTypeCode: businessTypeCode, // Keep this if you need it, or adjust as necessary
    physicalAddressCity: physicalAddressCity, // Use the input value
    primaryNaics: primaryNaics, // Use the input value
    registrationStatus: "A", // Default
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
        
        <a id="output-style" href="${downloadUrl}" target="_blank">Click Here To Download CSV ${businessTypeCode}</a>
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

async function fetchDataJson() {
  const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle";
  const samApi = new SamGovAPI(apiKey);

  const physicalAddressCity = document
    .getElementById("physicalAddressCity")
    .value.trim();
  const businessTypeCode = document
    .getElementById("socioEconomicDesignations")
    .value.trim();
  const primaryNaics = document.getElementById("primaryNaics").value.trim();

  if (!validateInput(businessTypeCode)) {
    document.getElementById("output").textContent =
      "Please enter valid inputs.";
    return;
  }

  const socioEconomicParams = {
    businessTypeCode,
    primaryNaics,
    registrationStatus: "A",
  };

  try {
    const response = await samApi.getPublicDataJson(socioEconomicParams);
    console.log(response);

    const topResults = response.entityData;
    console.log(response.entityData);

    renderResults(topResults);
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
  }
}

function renderResults(topResults) {
  const outputElement = document.getElementById("output");
  outputElement.innerHTML = "";

  topResults.forEach((entity, index) => {
    const pointsOfContact = entity.pointsOfContact || {};
    const coreData = entity.coreData || {};
    const assertions = entity.assertions || {};
    const entityRegistration = entity.entityRegistration || {};
    const financialInformation = coreData.financialInformation || {};
    const governmentBusinessPOC = pointsOfContact.governmentBusinessPOC || {};
    const entityInformation = coreData.entityInformation || {};
    const physicalAddress = coreData.physicalAddress || {};
    const generalInformation = coreData.generalInformation || {};
    const disasterReliefData = assertions.disasterReliefData || {};
    const goodsAndServices = assertions.goodsAndServices || {};

    if (!entityInformation.entityURL) return;

    const fields = [
      { label: "First Name", value: governmentBusinessPOC.firstName },
      { label: "Last Name", value: governmentBusinessPOC.lastName },
      {
        label: "Legal Business Name",
        value: entityRegistration.legalBusinessName,
      },
      { label: "DBA", value: entityRegistration.dbaName },
      { label: "Primary NAICS", value: goodsAndServices.primaryNaics },
      {
        label: "Entity Structure Code",
        value: generalInformation.entityStructureCode,
      },
      {
        label: "Profit Structure Code",
        value: generalInformation.profitStructureCode,
      },
      {
        label: "Disaster Registry",
        value: disasterReliefData.disasterRegistryFlag,
      },
      {
        label: "Bonding",
        value: disasterReliefData.bondingFlag,
      },
      {
        label: "Credit Card Usage",
        value: financialInformation.creditCardUsage,
      },
      {
        label: "Registration Date",
        value: entityRegistration.registrationDate,
      },
      { label: "UEI", value: entityRegistration.ueiSAM },
      { label: "Cage Code", value: entityRegistration.cageCode },
      {
        label: "Purpose of Registration",
        value: entityRegistration.purposeOfRegistrationDesc,
      },
      {
        label: "Registration Status",
        value: entityRegistration.registrationStatus,
      },
      { label: "Last Update", value: entityRegistration.lastUpdateDate },
      {
        label: "Registration Expiration Date",
        value: entityRegistration.registrationExpirationDate,
      },
      {
        label: "Entity Start Date",
        value: entityInformation.entityStartDate,
      },
      {
        label: "Submission Date",
        value: entityInformation.submissionDate,
      },
      {
        label: "Congressional District",
        value: coreData.congressionalDistrict,
      },
      {
        label: "Address",
        value:
          physicalAddress.addressLine1 +
          ", " +
          physicalAddress.city +
          ", " +
          physicalAddress.stateOrProvinceCode +
          " " +
          physicalAddress.zipCode,
      },
      { label: "Website", value: entityInformation.entityURL, isLink: true },
      {
        label: "NAICS List",
        value: goodsAndServices.naicsList
          .map((item) => item.naicsCode)
          .join(", "),
      },
    ];

    const fieldsHtml = fields
      .filter((field) => field.value)
      .map((field) => {
        const value = field.isLink
          ? `<a href="${field.value}" target="_blank">${field.value}</a>`
          : field.value;
        return `<p><strong>${field.label}:</strong> ${value}</p>`;
      })
      .join("");

    const result = `
      <div class="result-card">
        <h4>Result #${index + 1}</h4>
        ${fieldsHtml}
      </div>
    `;
    outputElement.innerHTML += result;
  });
}

// Validation function
function validateInput(input) {
  // Check if the input is not empty and is a valid string (you can add more checks if needed)
  return input.length > 0;
}
