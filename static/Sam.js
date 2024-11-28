class SamGovAPI {
  static BASE_URL = "https://api.sam.gov/entity-information/v3/entities?";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getPublicData(params = {}) {
    params.api_key = this.apiKey;
    params.samRegistered = "Yes";
    params.format = "csv";
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
      return response.data;
    } else {
      throw new Error(`Error: ${response.status} - ${response.data}`);
    }
  }
}

let currentPage = 1;
const resultsPerPage = 100;
let allResults = [];
let displayedCageCodes = new Set();

async function fetchData() {
  const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle";
  const samApi = new SamGovAPI(apiKey);

  const businessTypeCode = document
    .getElementById("socioEconomicDesignations")
    .value.trim();

  const selectedCertifications = Array.from(
    document.querySelectorAll('input[name="sbaBusinessTypeCode"]:checked')
  )
    .map((checkbox) => checkbox.value)
    .filter(Boolean)
    .join(" ");

  const physicalAddressProvinceOrStateCode = document
    .getElementById("physicalAddressProvinceOrStateCode")
    .value.trim();

  const socioEconomicParams = {
    businessTypeCode: businessTypeCode,
    physicalAddressProvinceOrStateCode: physicalAddressProvinceOrStateCode,
    sbaBusinessTypeCode: selectedCertifications, // Use the collected values
    registrationStatus: "A",
  };

  try {
    const response = await samApi.getPublicData(socioEconomicParams);
    const downloadUrl = response
      .replace("REPLACE_WITH_API_KEY", apiKey)
      .replace("Extract File will be available for download with url: ", "")
      .replace(
        "in some time. If you have requested for an email notification, you will receive it once the file is ready for download.",
        ""
      );

    const tokenIndex = downloadUrl.indexOf("token=");
    if (tokenIndex !== -1) {
      const firstPart = downloadUrl.substring(0, tokenIndex + 6);
      const secondPart = downloadUrl.substring(tokenIndex + 6);

      const outputHtml = `
        <a id="output-style" href="${downloadUrl}" target="_blank">Click Here To Download CSV ${businessTypeCode}</a>
      `;

      document.getElementById("output").innerHTML = outputHtml;
    } else {
      document.getElementById("output").textContent =
        "Token not found in the URL.";
    }
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
  }
}
async function fetchDataJson(resetResults = false) {
  if (resetResults) {
    currentPage = 1;
    document.getElementById("output").innerHTML = "";
  }

  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.style.display = "block";

  try {
    // Get selected certifications and business types
    const selectedCertifications = Array.from(
      document.querySelectorAll('input[name="sbaBusinessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean)
      .join("~");

    const businessTypeCode = Array.from(
      document.querySelectorAll('input[name="businessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean)
      .join("~");

    const state = document
      .getElementById("physicalAddressProvinceOrStateCode")
      .value.trim();

    // Call Flask endpoint with search parameters
    const response = await fetch("http://localhost:5001/process-sam-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors", // Add this line
      body: JSON.stringify({
        sbaBusinessTypeCode: selectedCertifications,
        businessTypeCode: businessTypeCode,
        physicalAddressProvinceOrStateCode: state,
        registrationStatus: "A",
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Handle the combined results
    if (data.entityData && data.entityData.length > 0) {
      document.getElementById("total-count").textContent = `Showing ${Math.min(
        currentPage * resultsPerPage,
        data.totalRecords
      )} of ${data.totalRecords} results`;

      if (data.totalRecords > currentPage * resultsPerPage) {
        document.getElementById("load-more").style.display = "block";
      } else {
        document.getElementById("load-more").style.display = "none";
      }

      renderResults(data.entityData, !resetResults);
    } else {
      document.getElementById("output").innerHTML = "<p>No results found</p>";
      document.getElementById("load-more").style.display = "none";
    }
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

function renderResults(results, append = false) {
  const outputElement = document.getElementById("output");

  if (!append) {
    outputElement.innerHTML = "";
  }

  if (!results || !Array.isArray(results)) {
    if (!append) {
      outputElement.innerHTML = "<p>No results found</p>";
    }
    return;
  }

  results.forEach((entity, index) => {
    // Define fields based on the CSV structure
    const fields = [
      {
        label: "First Name",
        value: entity["governmentBusinessPOC.firstName"],
      },
      {
        label: "Last Name",
        value: entity["governmentBusinessPOC.lastName"],
      },
      {
        label: "Legal Business Name",
        value: entity.legalBusinessName,
      },
      {
        label: "DBA",
        value: entity.dbaName,
      },
      {
        label: "Primary NAICS",
        value: entity["assertions.primaryNaics"],
      },
      {
        label: "UEI",
        value: entity.ueiSAM,
      },
      {
        label: "Cage Code",
        value: entity.cageCode,
      },
      {
        label: "Address",
        value: [
          entity["physicalAddress.addressLine1"],
          entity["physicalAddress.city"],
          entity["physicalAddress.stateOrProvinceCode"],
          entity["physicalAddress.zipCode"],
        ]
          .filter(Boolean)
          .join(", "),
      },
      {
        label: "Website",
        value: entity.entityURL,
        isLink: true,
      },
      {
        label: "NAICS List",
        value: entity["assertions.naicsCode"],
      },
    ];

    const businessCard = document.createElement("div");
    businessCard.className = "result-card";

    const fieldsHtml = fields
      .filter((field) => field.value)
      .map((field) => {
        const value = field.isLink
          ? `<a href="${field.value}" target="_blank">${field.value}</a>`
          : field.value;
        return `<p><strong>${field.label}:</strong> ${value}</p>`;
      })
      .join("");

    businessCard.innerHTML = `
      <h4>Result #${index + 1}</h4>
      ${fieldsHtml}
    `;

    outputElement.appendChild(businessCard);
  });
}

function validateInput(input) {
  return input.length > 0;
}

// Validation function
function validateInput(input) {
  // Check if the input is not empty and is a valid string (you can add more checks if needed)
  return input.length > 0;
}

// Check if the input is not empty and is a valid string (you can add more checks if needed)
