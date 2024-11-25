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

  const sbaBusinessTypeCode = document
    .getElementById("sbaBusinessTypeCode")
    .value.trim();

  const physicalAddressProvinceOrStateCode = document
    .getElementById("physicalAddressProvinceOrStateCode")
    .value.trim();

  const socioEconomicParams = {
    businessTypeCode: businessTypeCode,
    physicalAddressProvinceOrStateCode: physicalAddressProvinceOrStateCode,
    sbaBusinessTypeCode: sbaBusinessTypeCode,
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
  const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle";
  const samApi = new SamGovAPI(apiKey);

  if (resetResults) {
    currentPage = 1;
    document.getElementById("output").innerHTML = "";
  }

  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.style.display = "block";

  const businessTypeCode = document
    .getElementById("socioEconomicDesignations")
    .value.trim();

  const sbaBusinessTypeCode = document
    .getElementById("sbaBusinessTypeCode")
    .value.trim();

  const physicalAddressProvinceOrStateCode = document
    .getElementById("physicalAddressProvinceOrStateCode")
    .value.trim();

  const socioEconomicParams = {
    businessTypeCode: businessTypeCode,
    physicalAddressProvinceOrStateCode: physicalAddressProvinceOrStateCode,
    sbaBusinessTypeCode: sbaBusinessTypeCode,
    registrationStatus: "A",
  };

  try {
    const response = await samApi.getPublicDataJson(socioEconomicParams);
    console.log("API Response:", response);

    if (response.entityData && response.entityData.length > 0) {
      const totalResults = response.totalRecords || 0;

      // Update total count display
      document.getElementById("total-count").textContent = `Showing ${Math.min(
        currentPage * resultsPerPage,
        totalResults
      )} of ${totalResults} results`;

      // Show/hide load more button based on whether there are more results
      if (totalResults > currentPage * resultsPerPage) {
        document.getElementById("load-more").style.display = "block";
      } else {
        document.getElementById("load-more").style.display = "none";
      }

      // Render the results
      renderResults(response.entityData, !resetResults);
    } else {
      document.getElementById("output").innerHTML = "<p>No results found</p>";
      document.getElementById("load-more").style.display = "none";
    }

    if (loadingDiv) loadingDiv.style.display = "none";
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

window.loadMore = async function () {
  currentPage++;
  await fetchDataJson(false);
};

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

    // Your existing fields definition...
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
