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

async function fetchData() {
  const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle";
  const samApi = new SamGovAPI(apiKey);

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
    physicalAddressProvinceOrStateCode: physicalAddressProvinceOrStateCode,
    sbaBusinessTypeCode: selectedCertifications,
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
      const outputHtml = `
        <a id="output-style" href="${downloadUrl}" target="_blank">Click Here To Download CSV</a>
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

      const loadMoreButton = document.getElementById("load-more");
      if (data.entityData.length > resultsPerPage) {
        loadMoreButton.style.display = "block";
      } else {
        loadMoreButton.style.display = "none";
      }

      renderResults(data.entityData.slice(0, resultsPerPage), false);
    } else {
      document.getElementById("output").innerHTML = "<p>No results found</p>";
      document.getElementById("load-more").style.display = "none";
      document.getElementById("total-count").textContent = "";
    }
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
    document.getElementById("total-count").textContent = "";
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

function loadMore() {
  currentPage++;
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;

  document.getElementById("total-count").textContent = `Showing ${Math.min(
    end,
    allResults.length
  )} of ${allResults.length} results`;

  renderResults(allResults.slice(start, end), true);

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

  results.forEach((entity, index) => {
    const businessCard = document.createElement("div");
    businessCard.className = "result-card";

    const fields = [
      {
        label: "Legal Business Name",
        value: entity.legalBusinessName,
      },
      {
        label: "Point of Contact",
        value:
          entity["governmentBusinessPOC.firstName"] &&
          entity["governmentBusinessPOC.lastName"]
            ? `${entity["governmentBusinessPOC.firstName"]} ${entity["governmentBusinessPOC.lastName"]}`
            : null,
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
        label: "UEI / Cage Code",
        value: `${entity.ueiSAM} / ${entity.cageCode}`,
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
      <h4>${entity.legalBusinessName}</h4>
      ${fieldsHtml}
    `;

    outputElement.appendChild(businessCard);
  });
}
