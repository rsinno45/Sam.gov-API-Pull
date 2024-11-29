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

function formatWebsiteUrl(url) {
  if (!url) return null;
  // If URL doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//i)) {
    return "https://" + url;
  }
  return url;
}

async function fetchData() {
  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.style.display = "block";

  try {
    // Get the same parameters as fetchDataJson
    const sbaTypes = Array.from(
      document.querySelectorAll('input[name="sbaBusinessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean);

    const businessTypes = Array.from(
      document.querySelectorAll('input[name="businessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean);

    const state = document
      .getElementById("physicalAddressProvinceOrStateCode")
      .value.trim();

    // Create request body
    const requestBody = {
      registrationStatus: "A",
      physicalAddressProvinceOrStateCode: state,
      format: "csv", // Add this for CSV format
    };

    if (sbaTypes.length > 0) {
      requestBody.sbaBusinessTypeCode = sbaTypes.join("&");
    }

    if (businessTypes.length > 0) {
      requestBody.businessTypeCode = businessTypes.join(",");
    }

    // Use your API to get CSV
    const apiKey = "4tzWNeSeCYFZVbsDTPQRKD9skFpJ92tqIDsnPrle";
    const samApi = new SamGovAPI(apiKey);
    const response = await samApi.getPublicData(requestBody);

    const downloadUrl = response
      .replace("REPLACE_WITH_API_KEY", apiKey)
      .replace("Extract File will be available for download with url: ", "")
      .replace(
        "in some time. If you have requested for an email notification, you will receive it once the file is ready for download.",
        ""
      );

    // Open download in new tab
    window.open(downloadUrl, "_blank");
  } catch (error) {
    console.error("API Error:", error);
    alert("Error downloading CSV: " + error.message);
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
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
    // Get selected SBA certification codes from checkboxes
    const sbaTypes = Array.from(
      document.querySelectorAll('input[name="sbaBusinessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean);

    // Get selected business type codes from checkboxes
    const businessTypes = Array.from(
      document.querySelectorAll('input[name="businessTypeCode"]:checked')
    )
      .map((checkbox) => checkbox.value)
      .filter(Boolean);

    const state = document
      .getElementById("physicalAddressProvinceOrStateCode")
      .value.trim();

    // Create the request body
    const requestBody = {
      registrationStatus: "A",
      physicalAddressProvinceOrStateCode: state,
    };

    // Add SBA codes if selected
    if (sbaTypes.length > 0) {
      requestBody.sbaBusinessTypeCode = sbaTypes.join(",");
    }

    // Add business types if selected
    if (businessTypes.length > 0) {
      requestBody.businessTypeCode = businessTypes.join(",");
    }

    const response = await fetch(
      "https://sam-gov-api-pull.onrender.com/process-sam-data",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Filter results if we have both A6 and XX selected
    let filteredData = data.entityData;
    if (sbaTypes.includes("A6") && sbaTypes.includes("XX") && data.entityData) {
      filteredData = data.entityData.filter((entity) => {
        // Split by tilde since that's the documented format
        const sbaCodes =
          typeof entity.sbaBusinessTypeCode === "string"
            ? entity.sbaBusinessTypeCode.split("~")
            : Array.isArray(entity.sbaBusinessTypeCode)
            ? entity.sbaBusinessTypeCode
            : [];

        return (
          sbaCodes.some((code) => code.startsWith("A6")) &&
          sbaCodes.some((code) => code.startsWith("XX"))
        );
      });
    }

    if (filteredData && filteredData.length > 0) {
      allResults = filteredData;

      document.getElementById("total-count").textContent = `Showing ${Math.min(
        resultsPerPage,
        filteredData.length
      )} of ${filteredData.length} results`;

      const loadMoreButton = document.getElementById("load-more");
      if (filteredData.length > resultsPerPage) {
        loadMoreButton.style.display = "block";
      } else {
        loadMoreButton.style.display = "none";
      }

      renderResults(filteredData.slice(0, resultsPerPage), false);
    } else {
      document.getElementById("output").innerHTML = "<p>No results found</p>";
      document.getElementById("load-more").style.display = "none";
      document.getElementById("download-csv").style.display = "none";
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
        value: formatWebsiteUrl(entity.entityURL),
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

// document.addEventListener("DOMContentLoaded", function () {
// Add the event listener to the form after DOM is loaded
//  document.getElementById("auth-form").addEventListener("submit", (e) => {
//    e.preventDefault();
// Add your authentication logic here
//    console.log("Form submitted");
//  });
// });

//function toggleAuth(type) {
//  const nameGroup = document.getElementById("name-group");
//  const authSubmit = document.getElementById("auth-submit");
//  const toggleButtons = document.querySelectorAll(".toggle-button");

// First remove active class from all buttons
// toggleButtons.forEach((button) => {
/*  button.classList.remove("active");
    button.style.backgroundColor = "#f7f7f7";
    button.style.color = "#717171";
  });

  // Then add active class to the clicked button
  const activeButton = Array.from(toggleButtons).find((button) =>
    button.textContent.toLowerCase().includes(type)
  );
  if (activeButton) {
    activeButton.classList.add("active");
    activeButton.style.backgroundColor = "#ff385c";
    activeButton.style.color = "white";
  }

  // Update form
  if (type === "login") {
    nameGroup.style.display = "none";
    authSubmit.textContent = "Log in";
  } else {
    nameGroup.style.display = "block";
    authSubmit.textContent = "Sign up";
  }
}*/
