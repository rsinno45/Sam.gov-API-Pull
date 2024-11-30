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

// CSV export function
function fetchData() {
  try {
    if (!allResults || allResults.length === 0) {
      console.error("No data available to export");
      return;
    }

    // Define the CSV headers and corresponding data fields
    const headers = [
      "Business Name",
      "DUNS",
      "CAGE Code",
      "Address",
      "City",
      "State",
      "ZIP Code",
      "Country",
      "Business Types",
      "SBA Certifications",
    ];

    // Convert data to CSV format
    const csvRows = [headers];

    allResults.forEach((entity) => {
      const row = [
        entity.legalBusinessName || "",
        entity.ueiSAM || "",
        entity.cageCode || "",
        entity.physicalAddress?.addressLine1 || "",
        entity.physicalAddress?.city || "",
        entity.physicalAddress?.stateOrProvinceCode || "",
        entity.physicalAddress?.zipCode || "",
        entity.physicalAddress?.countryCode || "",
        (entity.businessTypes?.businessTypeList || [])
          .map((type) => type.businessTypeDesc)
          .join("; ") || "",
        (entity.businessTypes?.sbaBusinessTypeList || [])
          .map((type) => type.sbaBusinessTypeDesc)
          .join("; ") || "",
      ];
      csvRows.push(row);
    });

    // Convert to CSV string
    const csvContent = csvRows
      .map((row) =>
        row
          .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `sam_data_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error("Error exporting to CSV:", error);
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

    const requestBody = {
      registrationStatus: "A",
      physicalAddressProvinceOrStateCode: state,
    };

    let queryParts = [];

    if (sbaTypes.length > 0) {
      const sbaQuery = sbaTypes
        .map((code) => `sbaBusinessTypeCode:${code}`)
        .join(" AND ");
      queryParts.push(`(${sbaQuery})`);
    }

    if (businessTypes.length > 0) {
      const businessQuery = businessTypes
        .map((code) => `businessTypeCode:${code}`)
        .join(" AND ");
      queryParts.push(`(${businessQuery})`);
    }

    if (queryParts.length > 0) {
      requestBody.q = queryParts.join(" AND ");
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

    if (data.entityData && data.entityData.length > 0) {
      // Sort the data alphabetically by legal business name
      const sortedData = data.entityData.sort((a, b) =>
        (a.legalBusinessName || "").localeCompare(b.legalBusinessName || "")
      );

      allResults = sortedData;

      document.getElementById("total-count").textContent = `Showing ${Math.min(
        resultsPerPage,
        sortedData.length
      )} of ${sortedData.length} results`;

      const loadMoreButton = document.getElementById("load-more");
      if (sortedData.length > resultsPerPage) {
        loadMoreButton.style.display = "block";
      } else {
        loadMoreButton.style.display = "none";
      }

      renderResults(sortedData.slice(0, resultsPerPage), false);
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
        label: "UEI / Cage Code",
        value: `${entity.ueiSAM} / ${entity.cageCode}`,
      },

      {
        label: "Website",
        value: formatWebsiteUrl(entity.entityURL),
        isLink: true,
      },
      {
        label: "Primary NAICS",
        value: entity["assertions.primaryNaics"],
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
