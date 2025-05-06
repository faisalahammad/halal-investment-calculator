// Check if the browser is online/offline
function updateOnlineStatus() {
  const offlineIndicator = document.getElementById("offlineIndicator");
  if (!navigator.onLine) {
    offlineIndicator.classList.add("show");
  } else {
    offlineIndicator.classList.remove("show");
  }
}

// Check if device has already installed the PWA
function isPWAInstalled() {
  // Check if in standalone mode or display-mode is standalone
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// Add offline/online event listeners
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // Check initial online status
  updateOnlineStatus();

  // Check if already installed as PWA and hide install prompt if needed
  if (isPWAInstalled()) {
    const installPrompt = document.getElementById("installPrompt");
    if (installPrompt) {
      installPrompt.style.display = "none";
    }
  }

  // PWA Install Prompt - only for mobile and tablet
  let deferredPrompt;
  const installPrompt = document.getElementById("installPrompt");
  const installButton = document.getElementById("installButton");

  // Function to check if the device is mobile or tablet
  function isMobileOrTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    // Regular expression to match common mobile and tablet devices
    const mobileRegex = /(android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile)/i;

    // Additional check for screen width (typically desktop is wider than 1024px)
    const isSmallScreen = window.innerWidth <= 1024;

    return mobileRegex.test(userAgent) || isSmallScreen;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Only show install prompt on mobile or tablet and if not already installed
    if (isMobileOrTablet() && !isPWAInstalled()) {
      // Update UI to notify the user they can install the PWA
      installPrompt.classList.add("show");
    }
  });

  installButton.addEventListener("click", (e) => {
    // Hide the install promotion
    installPrompt.classList.remove("show");
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  });

  // Initialize form elements
  const calculatorForm = document.getElementById("calculatorForm");
  const saveButton = document.getElementById("saveCalculation");
  const resetButton = document.getElementById("resetCalculator");
  const rateTypeInputs = document.getElementsByName("rateType");

  // Add event listeners if elements exist
  if (calculatorForm) {
    calculatorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      calculateResults();
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", saveCurrentCalculation);
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      const merchantSelect = document.getElementById("merchant");
      const projectInput = document.getElementById("project");
      const durationInput = document.getElementById("duration");
      const investmentInput = document.getElementById("investment");
      const resultsSection = document.getElementById("results");

      // Reset form fields
      if (merchantSelect) merchantSelect.value = "biniyog.io";
      if (projectInput) projectInput.value = "";
      if (durationInput) durationInput.value = "";
      if (investmentInput) investmentInput.value = "";

      // Reset rate inputs based on current rate type
      const rateType = getSelectedRateType();
      if (rateType === "project") {
        const minProjectRate = document.getElementById("minProjectRate");
        const maxProjectRate = document.getElementById("maxProjectRate");
        if (minProjectRate) minProjectRate.value = "";
        if (maxProjectRate) maxProjectRate.value = "";
      } else {
        const minAnnualRate = document.getElementById("minAnnualRate");
        const maxAnnualRate = document.getElementById("maxAnnualRate");
        if (minAnnualRate) minAnnualRate.value = "";
        if (maxAnnualRate) maxAnnualRate.value = "";
      }

      // Hide results and reset state
      if (resultsSection) resultsSection.style.display = "none";
      localStorage.removeItem("editingIndex");

      // Reset calculate button text
      const calculateButton = document.getElementById("calculate");
      if (calculateButton) {
        calculateButton.innerHTML = '<i class="bi bi-calculator me-2"></i>Calculate Profit';
      }

      // Focus on project input
      if (projectInput) projectInput.focus();
    });
  }

  // Add event listeners for rate type changes
  if (rateTypeInputs.length > 0) {
    Array.from(rateTypeInputs).forEach((radio) => {
      radio.addEventListener("change", updateRateInputs);
    });
  }

  // Initialize rate inputs display
  updateRateInputs();

  // Display saved calculations on page load
  try {
    displaySavedCalculations();
  } catch (error) {
    console.error("Error displaying saved calculations:", error);
  }

  // Register service worker only if protocol is https or http
  if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.protocol === "http:")) {
    window.addEventListener("load", () => {
      try {
        navigator.serviceWorker
          .register("./service-worker.js")
          .then((registration) => {
            console.log("ServiceWorker registration successful with scope: ", registration.scope);
          })
          .catch((error) => {
            console.log("ServiceWorker registration failed: ", error);
          });
      } catch (error) {
        console.log("ServiceWorker registration error caught: ", error);
      }
    });
  }

  // Function to format numbers with Bangladeshi thousand separators
  function formatBDCurrency(number) {
    // Convert to string and split at decimal point
    let parts = number.toFixed(2).split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1];

    // Add Bangladeshi thousand separators (1,00,000 format)
    let formattedInteger = "";
    let count = 0;

    // Process from right to left
    for (let i = integerPart.length - 1; i >= 0; i--) {
      formattedInteger = integerPart[i] + formattedInteger;
      count++;

      // Add comma after first 3 digits, then after every 2 digits
      if (i > 0 && count === 3) {
        formattedInteger = "," + formattedInteger;
        count = 0;
      } else if (i > 0 && count === 2 && formattedInteger.includes(",")) {
        formattedInteger = "," + formattedInteger;
        count = 0;
      }
    }

    // Combine with decimal part
    return "৳" + formattedInteger + "." + decimalPart;
  }

  // Function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  // Function to toggle favorite status
  function toggleFavorite(index) {
    try {
      const savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");
      savedCalculations[index].favorite = !savedCalculations[index].favorite;
      localStorage.setItem("savedCalculations", JSON.stringify(savedCalculations));
      displaySavedCalculations();
    } catch (e) {
      console.log("Error toggling favorite:", e);
      alert("Error updating favorite status. Please try again.");
    }
  }

  // Function to display saved calculations
  function displaySavedCalculations() {
    const savedCalculationsList = document.getElementById("savedCalculationsList");
    if (!savedCalculationsList) {
      console.error("Could not find savedCalculationsList element");
      return;
    }

    savedCalculationsList.innerHTML = ""; // Clear existing content

    try {
      // Get saved calculations from localStorage
      let savedCalculations = [];
      try {
        savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");
      } catch (e) {
        console.error("Error parsing saved calculations:", e);
        savedCalculations = [];
      }

      // Filter out expired calculations (older than 30 days)
      const currentDate = new Date();
      const validCalculations = savedCalculations.filter((calc) => {
        if (!calc || !calc.timestamp) return false;
        try {
          const calcDate = new Date(calc.timestamp);
          const daysDiff = (currentDate - calcDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        } catch (e) {
          console.error("Error processing calculation date:", e);
          return false;
        }
      });

      // Update localStorage with only valid calculations
      if (validCalculations.length !== savedCalculations.length) {
        localStorage.setItem("savedCalculations", JSON.stringify(validCalculations));
      }

      if (validCalculations.length === 0) {
        savedCalculationsList.innerHTML = '<div class="text-center p-3">No saved calculations found.</div>';
        return;
      }

      // Create accordion items for each saved calculation
      validCalculations.forEach((calc, index) => {
        if (!calc || !calc.results || !calc.inputs) {
          console.error("Invalid calculation data:", calc);
          return;
        }

        try {
          const accordionItem = document.createElement("div");
          accordionItem.className = "accordion-item";
          if (calc.favorite) {
            accordionItem.classList.add("favorite-item");
          }

          // Create header content with a better layout
          const headerContent = document.createElement("div");
          headerContent.className = "d-flex justify-content-between align-items-center w-100 flex-wrap";

          // Create left section with merchant and project info
          const leftSection = document.createElement("div");
          leftSection.className = "d-flex align-items-center project-info";
          leftSection.innerHTML = `
            <div>
              <div class="merchant-name"><i class="bi bi-shop me-2"></i>${calc.merchant || "Unknown Merchant"}</div>
              <div class="project-name text-muted">${calc.project || "Unnamed Project"}</div>
            </div>
          `;

          // Create middle section with duration and return rate
          const middleSection = document.createElement("div");
          middleSection.className = "text-center mx-4 middleSection";
          middleSection.innerHTML = `
            <div class="duration"><i class="bi bi-calendar-month me-1"></i>${calc.inputs.duration || 0} months</div>
            <div class="return-rate text-success">${(calc.results.minYearlyReturnRate || 0).toFixed(2)}% - ${(calc.results.maxYearlyReturnRate || 0).toFixed(2)}% yearly</div>
          `;

          // Create investment amount badge (right side)
          const investmentAmount = document.createElement("span");
          investmentAmount.className = "investment-amount-badge";
          investmentAmount.textContent = formatBDCurrency(calc.inputs.investment || 0);

          // Create button group for actions
          const buttonGroup = document.createElement("div");
          buttonGroup.className = "btn-group ms-2";

          const favoriteButton = document.createElement("button");
          favoriteButton.className = `btn btn-favorite ${calc.favorite ? "active" : ""}`;
          favoriteButton.innerHTML = `<i class="bi bi-heart${calc.favorite ? "-fill" : ""}"></i>`;
          favoriteButton.setAttribute("title", calc.favorite ? "Remove from favorites" : "Add to favorites");
          favoriteButton.onclick = function (e) {
            e.stopPropagation();
            toggleFavorite(index);
          };

          const editButton = document.createElement("button");
          editButton.className = "btn btn-primary";
          editButton.innerHTML = '<i class="bi bi-pencil"></i>';
          editButton.setAttribute("title", "Edit this calculation");
          editButton.onclick = function (e) {
            e.stopPropagation();
            editCalculation(index, calc);
          };

          const deleteButton = document.createElement("button");
          deleteButton.className = "btn btn-danger";
          deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
          deleteButton.setAttribute("title", "Delete this calculation");
          deleteButton.onclick = function (e) {
            e.stopPropagation();
            deleteCalculation(index);
          };

          buttonGroup.appendChild(favoriteButton);
          buttonGroup.appendChild(editButton);
          buttonGroup.appendChild(deleteButton);

          // Compose header
          headerContent.appendChild(leftSection);
          headerContent.appendChild(middleSection);
          headerContent.appendChild(investmentAmount);
          headerContent.appendChild(buttonGroup);

          // Create the accordion header and body
          const accordionHeader = document.createElement("h2");
          accordionHeader.className = "accordion-header";
          accordionHeader.id = `heading${index}`;

          const accordionButton = document.createElement("button");
          accordionButton.className = "accordion-button collapsed";
          accordionButton.type = "button";
          accordionButton.setAttribute("data-bs-toggle", "collapse");
          accordionButton.setAttribute("data-bs-target", `#collapse${index}`);
          accordionButton.setAttribute("aria-expanded", "false");
          accordionButton.setAttribute("aria-controls", `collapse${index}`);
          accordionButton.appendChild(headerContent);

          accordionHeader.appendChild(accordionButton);

          const accordionCollapse = document.createElement("div");
          accordionCollapse.id = `collapse${index}`;
          accordionCollapse.className = "accordion-collapse collapse";
          accordionCollapse.setAttribute("aria-labelledby", `heading${index}`);
          accordionCollapse.setAttribute("data-bs-parent", "#savedCalculationsList");

          const accordionBody = document.createElement("div");
          accordionBody.className = "accordion-body";

          // Create detailed content for the accordion body
          const detailsContent = document.createElement("div");
          detailsContent.innerHTML = `
            <div class="row">
              <div class="col-md-6">
                <h5><i class="bi bi-info-circle me-2"></i>Input Details</h5>
                <ul class="list-group mb-3">
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-shop me-2"></i>Merchant:</span>
                    <span class="fw-bold">${calc.merchant || "Unknown"}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-folder me-2"></i>Project:</span>
                    <span class="fw-bold">${calc.project || "Unnamed"}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-percent me-2"></i>Earning Percentage:</span>
                    <span class="fw-bold">${(calc.inputs.minEarning || 0).toFixed(2)}% - ${(calc.inputs.maxEarning || 0).toFixed(2)}%</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-calendar-month me-2"></i>Duration:</span>
                    <span class="fw-bold">${calc.inputs.duration || 0} months</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-currency-dollar me-2"></i>Investment Amount:</span>
                    <span class="fw-bold">${formatBDCurrency(calc.inputs.investment || 0)}</span>
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5><i class="bi bi-graph-up me-2"></i>Results</h5>
                <ul class="list-group mb-3">
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-graph-up me-2"></i>Yearly Return Rate:</span>
                    <span class="fw-bold text-success">${(calc.results.minYearlyReturnRate || 0).toFixed(2)}% - ${(calc.results.maxYearlyReturnRate || 0).toFixed(2)}%</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-cash-stack me-2"></i>Total Profit:</span>
                    <span class="fw-bold">${formatBDCurrency(calc.results.minTotalProfit || 0)} - ${formatBDCurrency(calc.results.maxTotalProfit || 0)}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><i class="bi bi-bank me-2"></i>Total Return:</span>
                    <span class="fw-bold">${formatBDCurrency(calc.results.minFinalValue || 0)} - ${formatBDCurrency(calc.results.maxFinalValue || 0)}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between projection-highlight">
                    <span><i class="bi bi-cash me-2"></i>12-Month Projection:</span>
                    <span class="fw-bold">${formatBDCurrency(calc.results.min12MonthProfit || 0)} - ${formatBDCurrency(calc.results.max12MonthProfit || 0)}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between projection-highlight">
                    <span><i class="bi bi-wallet2 me-2"></i>12-Month Total Return:</span>
                    <span class="fw-bold">${formatBDCurrency(calc.results.min12MonthTotal || 0)} - ${formatBDCurrency(calc.results.max12MonthTotal || 0)}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="text-muted mt-2">
              <small><i class="bi bi-clock me-1"></i>Calculated on: ${formatDate(calc.timestamp)}</small>
            </div>
          `;

          accordionBody.appendChild(detailsContent);
          accordionCollapse.appendChild(accordionBody);
          accordionItem.appendChild(accordionHeader);
          accordionItem.appendChild(accordionCollapse);
          savedCalculationsList.appendChild(accordionItem);
        } catch (error) {
          console.error("Error creating accordion item:", error);
        }
      });
    } catch (error) {
      console.error("Error displaying saved calculations:", error);
      savedCalculationsList.innerHTML = '<div class="text-center p-3 text-danger">Error loading saved calculations.</div>';
    }
  }

  // Function to delete a saved calculation
  function deleteCalculation(index) {
    try {
      if (confirm("Are you sure you want to delete this calculation?")) {
        const savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");
        savedCalculations.splice(index, 1);
        localStorage.setItem("savedCalculations", JSON.stringify(savedCalculations));
        displaySavedCalculations();
      }
    } catch (e) {
      console.log("Error deleting calculation:", e);
      alert("Error deleting calculation. Please try again.");
    }
  }

  // Function to edit a saved calculation
  function editCalculation(index, calc) {
    // Fill the form with the calculation data
    document.getElementById("merchant").value = calc.merchant;
    document.getElementById("project").value = calc.project;
    document.getElementById("minEarning").value = calc.inputs.minEarning;
    document.getElementById("maxEarning").value = calc.inputs.maxEarning;
    document.getElementById("duration").value = calc.inputs.duration;
    document.getElementById("investment").value = calc.inputs.investment;

    // Show the form section
    document.getElementById("results").style.display = "none";

    // Store the index being edited
    localStorage.setItem("editingIndex", index.toString());

    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update calculate button text
    const calculateButton = document.getElementById("calculate");
    calculateButton.innerHTML = '<i class="bi bi-save me-2"></i>Update Calculation';
  }

  // Get DOM elements
  const merchantSelect = document.getElementById("merchantSelect");
  const projectInput = document.getElementById("projectInput");
  const fixedEarning = document.getElementById("fixedEarning");
  const minEarning = document.getElementById("minEarning");
  const maxEarning = document.getElementById("maxEarning");
  const minAnnualEarning = document.getElementById("minAnnualEarning");
  const maxAnnualEarning = document.getElementById("maxAnnualEarning");
  const duration = document.getElementById("duration");
  const amount = document.getElementById("amount");
  const profitTypeRadios = document.getElementsByName("profitType");
  const profitInputs = {
    fixed: document.getElementById("fixedProfitInput"),
    range: document.getElementById("rangeProfitInput"),
    annual: document.getElementById("annualProfitInput"),
  };

  // Handle profit type selection
  profitTypeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      // Hide all profit inputs first
      Object.values(profitInputs).forEach((input) => (input.style.display = "none"));

      // Show the selected profit input
      profitInputs[e.target.value].style.display = e.target.value === "fixed" ? "block" : "flex";

      // Clear other input values
      if (e.target.value === "fixed") {
        minEarning.value = "";
        maxEarning.value = "";
        minAnnualEarning.value = "";
        maxAnnualEarning.value = "";
      } else if (e.target.value === "range") {
        fixedEarning.value = "";
        minAnnualEarning.value = "";
        maxAnnualEarning.value = "";
      } else if (e.target.value === "annual") {
        fixedEarning.value = "";
        minEarning.value = "";
        maxEarning.value = "";
      }

      // Recalculate if all required fields are filled
      calculateProfit();
    });
  });

  function getSelectedProfitType() {
    const selectedRadio = document.querySelector('input[name="rateType"]:checked');
    return selectedRadio?.value || "project"; // default to project if none selected
  }

  function getEarningValues() {
    const profitType = getSelectedProfitType();
    let min = 0,
      max = 0;

    switch (profitType) {
      case "fixed":
        min = max = parseFloat(fixedEarning.value) || 0;
        break;
      case "range":
        min = parseFloat(minEarning.value) || 0;
        max = parseFloat(maxEarning.value) || 0;
        break;
      case "annual":
        // Convert annual rate to project rate
        const months = parseFloat(duration.value) || 0;
        min = parseFloat(minAnnualEarning.value) || 0;
        max = parseFloat(maxAnnualEarning.value) || 0;
        min = (min / 12) * months;
        max = (max / 12) * months;
        break;
    }

    return { min, max };
  }

  function calculateProfit() {
    const profitType = getSelectedProfitType();
    const earningValues = getEarningValues();
    const durationValue = parseFloat(duration.value) || 0;
    const amountValue = parseFloat(amount.value) || 0;

    // Check if required fields are filled
    if (!validateInputs()) {
      clearResults();
      return;
    }

    // Calculate profits
    const minProfit = (amountValue * earningValues.min) / 100;
    const maxProfit = (amountValue * earningValues.max) / 100;

    // Calculate annual returns for display
    let annualMin = (earningValues.min / durationValue) * 12;
    let annualMax = (earningValues.max / durationValue) * 12;

    // Update UI
    updateResults(earningValues.min, earningValues.max, minProfit, maxProfit, annualMin, annualMax);
  }

  // Function to validate inputs
  function validateInputs() {
    try {
      const merchant = document.getElementById("merchant")?.value;
      const project = document.getElementById("project")?.value;
      const duration = parseFloat(document.getElementById("duration")?.value);
      const investment = parseFloat(document.getElementById("investment")?.value);
      const rateType = getSelectedRateType();

      if (!merchant || !project || !duration || !investment) {
        return false;
      }

      if (rateType === "project") {
        const minRate = parseFloat(document.getElementById("minProjectRate")?.value);
        const maxRate = parseFloat(document.getElementById("maxProjectRate")?.value);
        return !isNaN(minRate) && !isNaN(maxRate);
      } else {
        const minRate = parseFloat(document.getElementById("minAnnualRate")?.value);
        const maxRate = parseFloat(document.getElementById("maxAnnualRate")?.value);
        return !isNaN(minRate) && !isNaN(maxRate);
      }
    } catch (error) {
      console.error("Error validating inputs:", error);
      return false;
    }
  }

  // Function to calculate results
  function calculateResults() {
    try {
      if (!validateInputs()) {
        alert("Please fill in all required fields with valid values.");
        return;
      }

      const investment = parseFloat(document.getElementById("investment")?.value) || 0;
      const duration = parseFloat(document.getElementById("duration")?.value) || 0;
      const rates = getProfitRates();

      if (!rates) {
        console.error("Invalid rates calculated");
        return;
      }

      // Calculate profits
      const minTotalProfit = (investment * rates.projectMin) / 100;
      const maxTotalProfit = (investment * rates.projectMax) / 100;

      // Calculate final values
      const minFinalValue = investment + minTotalProfit;
      const maxFinalValue = investment + maxTotalProfit;

      // Calculate 12-month projection
      const min12MonthProfit = (investment * rates.annualMin) / 100;
      const max12MonthProfit = (investment * rates.annualMax) / 100;
      const min12MonthTotal = investment + min12MonthProfit;
      const max12MonthTotal = investment + max12MonthProfit;

      // Update UI safely
      const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      };

      updateElement("projectDuration", duration);
      updateElement("projectReturn", `${rates.projectMin.toFixed(2)}% - ${rates.projectMax.toFixed(2)}%`);
      updateElement("displayDuration", duration);
      updateElement("displayDuration2", duration);
      updateElement("yearlyReturnRate", `${rates.annualMin.toFixed(2)}% - ${rates.annualMax.toFixed(2)}%`);
      updateElement("totalProfitRange", `${formatBDCurrency(minTotalProfit)} - ${formatBDCurrency(maxTotalProfit)}`);
      updateElement("finalValueRange", `${formatBDCurrency(minFinalValue)} - ${formatBDCurrency(maxFinalValue)}`);
      updateElement("twelveMonthRange", `${formatBDCurrency(min12MonthProfit)} - ${formatBDCurrency(max12MonthProfit)}`);
      updateElement("twelveMonthTotalRange", `${formatBDCurrency(min12MonthTotal)} - ${formatBDCurrency(max12MonthTotal)}`);

      // Show results section
      const resultsSection = document.getElementById("results");
      if (resultsSection) resultsSection.style.display = "block";
    } catch (error) {
      console.error("Error calculating results:", error);
      alert("An error occurred while calculating results. Please check your inputs and try again.");
    }
  }

  // Function to save the current calculation
  function saveCurrentCalculation() {
    try {
      const merchant = document.getElementById("merchant")?.value;
      const project = document.getElementById("project")?.value;
      const duration = document.getElementById("duration")?.value;
      const investment = document.getElementById("investment")?.value;

      if (!merchant || !project || !duration || !investment) {
        alert("Please fill in all required fields before saving.");
        return;
      }

      const rates = getProfitRates();
      if (!rates) {
        alert("Please enter valid profit rates before saving.");
        return;
      }

      const calculationData = {
        merchant,
        project,
        timestamp: new Date().toISOString(),
        inputs: {
          duration: parseFloat(duration),
          investment: parseFloat(investment),
          minEarning: rates.projectMin,
          maxEarning: rates.projectMax,
        },
        results: {
          minYearlyReturnRate: rates.annualMin,
          maxYearlyReturnRate: rates.annualMax,
          minTotalProfit: (parseFloat(investment) * rates.projectMin) / 100,
          maxTotalProfit: (parseFloat(investment) * rates.projectMax) / 100,
          minFinalValue: parseFloat(investment) + (parseFloat(investment) * rates.projectMin) / 100,
          maxFinalValue: parseFloat(investment) + (parseFloat(investment) * rates.projectMax) / 100,
          min12MonthProfit: (parseFloat(investment) * rates.annualMin) / 100,
          max12MonthProfit: (parseFloat(investment) * rates.annualMax) / 100,
          min12MonthTotal: parseFloat(investment) + (parseFloat(investment) * rates.annualMin) / 100,
          max12MonthTotal: parseFloat(investment) + (parseFloat(investment) * rates.annualMax) / 100,
        },
        favorite: false,
      };

      // Get existing saved calculations
      let savedCalculations = [];
      try {
        savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");
      } catch (e) {
        console.error("Error parsing saved calculations:", e);
        savedCalculations = [];
      }

      // Check if a calculation with the same project name already exists
      const existingIndex = savedCalculations.findIndex((calc) => calc.merchant === merchant && calc.project === project);

      if (existingIndex !== -1) {
        if (confirm("A calculation with this project name already exists. Do you want to update it?")) {
          calculationData.favorite = savedCalculations[existingIndex].favorite || false;
          savedCalculations[existingIndex] = calculationData;
        } else {
          return;
        }
      } else {
        savedCalculations.unshift(calculationData);
      }

      // Update localStorage
      localStorage.setItem("savedCalculations", JSON.stringify(savedCalculations));

      // Refresh the display
      displaySavedCalculations();

      // Show success message
      alert("Calculation saved successfully!");

      // Reset the form
      const resetButton = document.getElementById("resetCalculator");
      if (resetButton) {
        resetButton.click();
      }
    } catch (e) {
      console.error("Error saving calculation:", e);
      alert("Error saving calculation. Please try again.");
    }
  }

  // Add event listener for rate type toggle
  document.getElementById("isAnnualRate").addEventListener("change", function () {
    const minInput = document.getElementById("minEarning");
    const maxInput = document.getElementById("maxEarning");
    const isAnnual = this.checked;

    // Update placeholders based on rate type
    minInput.placeholder = isAnnual ? "Min annual rate (e.g. 17)" : "Min project rate (e.g. 9)";
    maxInput.placeholder = isAnnual ? "Max annual rate (e.g. 18)" : "Max project rate (e.g. 10)";

    // Clear existing values
    minInput.value = "";
    maxInput.value = "";
  });

  // Function to get selected rate type
  function getSelectedRateType() {
    const selectedRadio = document.querySelector('input[name="rateType"]:checked');
    return selectedRadio?.value || "project"; // default to project if none selected
  }

  // Function to get current profit rates
  function getProfitRates() {
    try {
      const rateType = getSelectedRateType();
      const duration = parseFloat(document.getElementById("duration")?.value) || 0;

      let projectMin = 0,
        projectMax = 0;

      if (rateType === "project") {
        projectMin = parseFloat(document.getElementById("minProjectRate")?.value) || 0;
        projectMax = parseFloat(document.getElementById("maxProjectRate")?.value) || 0;
      } else {
        // Convert annual rate to project rate
        const annualMin = parseFloat(document.getElementById("minAnnualRate")?.value) || 0;
        const annualMax = parseFloat(document.getElementById("maxAnnualRate")?.value) || 0;
        projectMin = (annualMin * duration) / 12;
        projectMax = (annualMax * duration) / 12;
      }

      if (duration === 0) return null;

      return {
        projectMin,
        projectMax,
        annualMin: (projectMin * 12) / duration,
        annualMax: (projectMax * 12) / duration,
      };
    } catch (error) {
      console.error("Error getting profit rates:", error);
      return null;
    }
  }

  // Function to show appropriate input fields based on rate type selection
  function updateRateInputs() {
    const rateType = getSelectedRateType();
    const projectRateInput = document.getElementById("projectRateInput");
    const annualRateInput = document.getElementById("annualRateInput");

    if (rateType === "project") {
      if (projectRateInput) projectRateInput.style.display = "flex";
      if (annualRateInput) annualRateInput.style.display = "none";
      // Clear annual rate inputs
      const minAnnualRate = document.getElementById("minAnnualRate");
      const maxAnnualRate = document.getElementById("maxAnnualRate");
      if (minAnnualRate) minAnnualRate.value = "";
      if (maxAnnualRate) maxAnnualRate.value = "";
    } else {
      if (projectRateInput) projectRateInput.style.display = "none";
      if (annualRateInput) annualRateInput.style.display = "flex";
      // Clear project rate inputs
      const minProjectRate = document.getElementById("minProjectRate");
      const maxProjectRate = document.getElementById("maxProjectRate");
      if (minProjectRate) minProjectRate.value = "";
      if (maxProjectRate) maxProjectRate.value = "";
    }
  }

  // Live Bangladeshi number formatting for Investment Amount input
  const investmentInput = document.getElementById("investment");
  if (investmentInput) {
    investmentInput.addEventListener("input", function (e) {
      // Remove all non-digit characters
      let rawValue = e.target.value.replace(/[^0-9]/g, "");
      if (!rawValue) {
        e.target.value = "";
        return;
      }
      // Format using Indian/Bangladeshi system
      let formatted = Number(rawValue).toLocaleString("en-IN");
      e.target.value = formatted;
    });
  }
});
