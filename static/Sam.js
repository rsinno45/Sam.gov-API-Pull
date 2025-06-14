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
// Main fetch function
async function fetchDataJson(resetResults = false) {
  if (resetResults) {
    currentPage = 1;
    allResults = [];
    document.getElementById("output").innerHTML = "";
    document.getElementById("download-csv").style.display = "none";
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
      const sortedData = data.entityData.sort((a, b) =>
        (a.legalBusinessName || "").localeCompare(b.legalBusinessName || "")
      );

      allResults = sortedData;

      document.getElementById("total-count").textContent = `Showing ${Math.min(
        resultsPerPage,
        sortedData.length
      )} of ${sortedData.length} results`;

      document.getElementById("download-csv").style.display = "block";

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
      document.getElementById("download-csv").style.display = "none";
      document.getElementById("total-count").textContent = "";
    }
  } catch (error) {
    console.error("API Error:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
    document.getElementById("total-count").textContent = "";
    document.getElementById("download-csv").style.display = "none";
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

// Remove all the individual search functions (fetchDataByName, fetchDataByUEI, etc.)
// Add this new combined search function:

async function performSearch(resetResults = true) {
  if (resetResults) {
    currentPage = 1;
    allResults = [];
    document.getElementById("output").innerHTML = "";
    document.getElementById("download-csv").style.display = "none";
  }

  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.style.display = "block";

  try {
    // Get all search parameters
    const businessName = document.getElementById("business-name").value.trim();
    const ueiNumber = document.getElementById("uei-name").value.trim();
    const cageCode = document.getElementById("cage-name").value.trim();
    const naicsCode = document.getElementById("naics-name").value.trim();
    const state = document
      .getElementById("physicalAddressProvinceOrStateCode")
      .value.trim();

    // Get selected certifications
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

    // Build request body with all parameters
    const requestBody = {
      registrationStatus: "A",
    };

    if (businessName) requestBody.legalBusinessName = businessName;
    if (ueiNumber) requestBody.ueiSAM = ueiNumber;
    if (cageCode) requestBody.cageCode = cageCode;
    if (naicsCode) requestBody.naicsCode = naicsCode;
    if (state) requestBody.physicalAddressProvinceOrStateCode = state;

    // Build certification query
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
      const sortedData = data.entityData.sort((a, b) =>
        (a.legalBusinessName || "").localeCompare(b.legalBusinessName || "")
      );

      allResults = sortedData;

      document.getElementById("total-count").textContent = `Showing ${Math.min(
        resultsPerPage,
        sortedData.length
      )} of ${sortedData.length} results`;

      document.getElementById("download-csv").style.display = "block";

      const loadMoreButton = document.getElementById("load-more");
      loadMoreButton.style.display =
        sortedData.length > resultsPerPage ? "block" : "none";

      renderResults(sortedData.slice(0, resultsPerPage), false);
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
    document.getElementById("download-csv").style.display = "none";
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

// CSV export function
function fetchData() {
  try {
    if (!allResults || allResults.length === 0) {
      console.error("No data available to export");
      return;
    }

    // Match headers to the fields shown in renderResults
    const headers = [
      "Legal Business Name",
      "DBA Name",
      "UEI",
      "Cage Code",
      "Physical Address Line 1",
      "Physical City",
      "Physical State",
      "Physical ZIP Code",
      "POC First Name",
      "POC Last Name",
      "Website",
      "Primary NAICS",
      "NAICS List",
      "Phone Number",
    ];

    const csvRows = [headers];

    allResults.forEach((entity) => {
      // Match the structure from renderResults
      const row = [
        entity.legalBusinessName || "",
        entity.dbaName || "",
        entity.ueiSAM || "",
        entity.cageCode || "",
        entity["physicalAddress.addressLine1"] || "",
        entity["physicalAddress.city"] || "",
        entity["physicalAddress.stateOrProvinceCode"] || "",
        entity["physicalAddress.zipCode"] || "",
        entity["governmentBusinessPOC.firstName"] || "",
        entity["governmentBusinessPOC.lastName"] || "",
        entity.entityURL || "",
        entity["assertions.primaryNaics"] || "",
        entity["assertions.naicsCode"] || "",
        entity[phoneNumber] || "",
      ];

      csvRows.push(row);
    });

    // Convert to CSV string with proper escaping
    const csvContent = csvRows
      .map((row) =>
        row
          .map((cell) => {
            const cellContent = (cell || "").toString();
            if (
              cellContent.includes(",") ||
              cellContent.includes('"') ||
              cellContent.includes("\n")
            ) {
              return `"${cellContent.replace(/"/g, '""')}"`;
            }
            return cell;
          })
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
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Error exporting to CSV:", error);
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

  results.forEach(async (entity, index) => {
    const businessCard = document.createElement("div");
    businessCard.className = "result-card";

    // First render SAM.gov data
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
        label: "Owner Name",
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

    const downloadButton = document.getElementById("download-csv");
    if (results && results.length > 0) {
      downloadButton.style.display = "block";
    } else {
      downloadButton.style.display = "none";
    }

    const fieldsHtml = fields
      .filter((field) => field.value)
      .map((field) => {
        const value = field.isLink
          ? `<a href="${field.value}" target="_blank">${field.value}</a>`
          : field.value;
        const className =
          field.label === "NAICS List" ? ' class="naics-content"' : "";
        return `<p${className}><strong>${field.label}:</strong> ${value}</p>`;
      })
      .join("");

    // Add button HTML before the closing businessCard div
    const contactButtonHtml = `
      <div class="contact-info-section">
        <button 
          class="contact-info-btn" 
          onclick="fetchContactInfo(this)" 
          data-uei="${entity.ueiSAM}" 
          data-cage="${entity.cageCode}"
          data-state="${entity["physicalAddress.stateOrProvinceCode"]}">
          Get Contact Information
        </button>
        <div class="contact-info-results" style="display: none;"></div>
      </div>
    `;

    businessCard.innerHTML = `
      <h4>${entity.legalBusinessName}</h4>
      ${fieldsHtml}
      ${contactButtonHtml}
    `;

    outputElement.appendChild(businessCard);
  });
}

// Add this to handle radio button changes
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[name="search-type"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      console.log("Event listener triggered!");
      const businessNameGroup = document.getElementById("business-name-group");
      const locationGroup = document.getElementById("location-group");
      const ueiNumber = document.getElementById("uei-group");
      const cageCode = document.getElementById("cage-group");
      const naicsCode = document.getElementById("naics-group");
      const certificationsGroup = document.getElementById(
        "certifications-group"
      );
      const businessBtn = document.getElementById("businessSearchButton");
      const ueiBtn = document.getElementById("ueiSearchButton");
      const cageBtn = document.getElementById("cageSearchButton");
      const naicsBtn = document.getElementById("naicsSearchButton");
      const certBtn = document.getElementById("certSearchButton");

      // Hide all groups
      businessNameGroup.style.display = "none";
      locationGroup.style.display = "none";
      ueiNumber.style.display = "none";
      cageCode.style.display = "none";
      naicsCode.style.display = "none";
      certificationsGroup.style.display = "none";
      businessBtn.style.display = "none";
      ueiBtn.style.display = "none";
      cageBtn.style.display = "none";
      naicsBtn.style.display = "none";
      certBtn.style.display = "none";

      // Show selected group
      switch (e.target.value) {
        case "name":
          businessNameGroup.style.display = "block";
          businessBtn.style.display = "block";
          break;
        case "socio":
          certificationsGroup.style.display = "block";
          certBtn.style.display = "block";
          locationGroup.style.display = "block";
          break;
        case "cage":
          cageCode.style.display = "block";
          cageBtn.style.display = "block";
          break;
        case "naics":
          naicsCode.style.display = "block";
          naicsBtn.style.display = "block";
          break;
        case "uei":
          ueiNumber.style.display = "block";
          ueiBtn.style.display = "block";
          break;
      }
    });
  });
});

// Add this function to handle fetching contact info
async function fetchContactInfo(button) {
  const resultDiv = button.nextElementSibling;
  button.disabled = true;
  button.textContent = "Loading...";

  try {
    const response = await fetch(
      "https://sam-gov-api-pull.onrender.com/get-dsbs-data",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uei: button.dataset.uei,
          cage_code: button.dataset.cage,
          state: button.dataset.state,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      let contactHtml = '<div class="additional-contact-info">';
      if (data.email_addresses.length > 0) {
        contactHtml += `<p><strong>Email Addresses:</strong> ${data.email_addresses.join(
          ", "
        )}</p>`;
      }
      if (data.phone_numbers.length > 0) {
        contactHtml += `<p><strong>Phone Numbers:</strong> ${data.phone_numbers.join(
          ", "
        )}</p>`;
      }
      if (data.additional_contacts.length > 0) {
        contactHtml += `<p><strong>Additional Contacts:</strong></p><ul>`;
        data.additional_contacts.forEach((contact) => {
          contactHtml += `<li>${contact}</li>`;
        });
        contactHtml += "</ul>";
      }
      contactHtml += "</div>";
      resultDiv.innerHTML = contactHtml;
    } else {
      resultDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p class="error">Error fetching contact information</p>`;
  } finally {
    button.disabled = false;
    button.textContent = "Get Contact Information";
    resultDiv.style.display = "block";
  }
}
