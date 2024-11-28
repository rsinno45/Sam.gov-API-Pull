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
const resultsPerPage = 10;
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
    allResults = [];
    document.getElementById("output").innerHTML = "";
  }

  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.style.display = "block";

  try {
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
    const response = await fetch(
      "https://sam-gov-api-pull.onrender.com/process-sam-data",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sbaBusinessTypeCode: selectedCertifications,
          businessTypeCode: businessTypeCode,
          physicalAddressProvinceOrStateCode: state,
          registrationStatus: "A",
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.entityData && data.entityData.length > 0) {
      allResults = data.entityData;
      document.getElementById("total-count").textContent = `Showing ${Math.min(
        resultsPerPage,
        data.entityData.length
      )} of ${data.entityData.length} results`;

      // Show load more button if there are more results
      const loadMoreButton = document.getElementById("load-more");
      if (data.entityData.length > resultsPerPage) {
        loadMoreButton.style.display = "block";
      } else {
        loadMoreButton.style.display = "none";
      }

      // Only render first page of results
      renderResults(data.entityData.slice(0, resultsPerPage), false);
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

function loadMore() {
  currentPage++;
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;

  // Update total count display
  document.getElementById("total-count").textContent = `Showing ${Math.min(
    end,
    allResults.length
  )} of ${allResults.length} results`;

  // Render next batch of results
  renderResults(allResults.slice(start, end), true);

  // Hide load more button if we've shown all results
  if (end >= allResults.length) {
    document.getElementById("load-more").style.display = "none";
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
      const businessCard = document.createElement("div");
      businessCard.className = "result-card";

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
