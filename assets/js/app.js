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
    installPrompt.style.display = "none";
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

  // Register service worker for PWA functionality
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // Use try-catch to handle errors gracefully
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
    savedCalculationsList.innerHTML = ""; // Clear existing content

    try {
      // Get saved calculations from localStorage
      const savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");

      // Filter out expired calculations (older than 30 days)
      const currentDate = new Date();
      const validCalculations = savedCalculations.filter((calc) => {
        const calcDate = new Date(calc.timestamp);
        const daysDiff = (currentDate - calcDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
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
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";
        if (calc.favorite) {
          accordionItem.classList.add("favorite-item");
        }

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

        // Create header content with a better layout
        const headerContent = document.createElement("div");
        headerContent.className = "d-flex justify-content-between align-items-center w-100";

        // Create left section with merchant and project info
        const leftSection = document.createElement("div");
        leftSection.className = "d-flex align-items-center";
        leftSection.innerHTML = `
          <div class="project-info">
            <div class="merchant-name"><i class="bi bi-shop me-2"></i>${calc.merchant}</div>
            <div class="project-name text-muted">${calc.project}</div>
          </div>
        `;

        // Create middle section with duration and return rate
        const middleSection = document.createElement("div");
        middleSection.className = "text-center mx-4";
        middleSection.innerHTML = `
          <div class="duration"><i class="bi bi-calendar-month me-1"></i>${calc.inputs.duration} months</div>
          <div class="return-rate text-success">${calc.results.minYearlyReturnRate.toFixed(2)}% - ${calc.results.maxYearlyReturnRate.toFixed(2)}% yearly</div>
        `;

        // Create button group for actions
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "btn-group ms-2";

        const favoriteButton = document.createElement("button");
        favoriteButton.className = `btn btn-favorite ${calc.favorite ? "active" : ""}`;
        favoriteButton.innerHTML = `<i class="bi bi-heart${calc.favorite ? "-fill" : ""}"></i>`;
        favoriteButton.setAttribute("title", calc.favorite ? "Remove from favorites" : "Add to favorites");
        favoriteButton.onclick = function (e) {
          e.stopPropagation(); // Prevent accordion from toggling
          toggleFavorite(index);
        };

        const editButton = document.createElement("button");
        editButton.className = "btn btn-primary";
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.setAttribute("title", "Edit this calculation");
        editButton.onclick = function (e) {
          e.stopPropagation(); // Prevent accordion from toggling
          editCalculation(index, calc);
        };

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.setAttribute("title", "Delete this calculation");
        deleteButton.onclick = function (e) {
          e.stopPropagation(); // Prevent accordion from toggling
          deleteCalculation(index);
        };

        buttonGroup.appendChild(favoriteButton);
        buttonGroup.appendChild(editButton);
        buttonGroup.appendChild(deleteButton);

        headerContent.appendChild(leftSection);
        headerContent.appendChild(middleSection);
        headerContent.appendChild(buttonGroup);
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
                  <span class="fw-bold">${calc.merchant}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-folder me-2"></i>Project:</span>
                  <span class="fw-bold">${calc.project}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-percent me-2"></i>Earning Percentage:</span>
                  <span class="fw-bold">${calc.inputs.minEarning}% - ${calc.inputs.maxEarning}%</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-calendar-month me-2"></i>Duration:</span>
                  <span class="fw-bold">${calc.inputs.duration} months</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-currency-dollar me-2"></i>Investment Amount:</span>
                  <span class="fw-bold">${formatBDCurrency(calc.inputs.investment)}</span>
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <h5><i class="bi bi-graph-up me-2"></i>Results</h5>
              <ul class="list-group mb-3">
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-graph-up me-2"></i>Yearly Return Rate:</span>
                  <span class="fw-bold text-success">${calc.results.minYearlyReturnRate.toFixed(2)}% - ${calc.results.maxYearlyReturnRate.toFixed(2)}%</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-cash-stack me-2"></i>Total Profit:</span>
                  <span class="fw-bold">${formatBDCurrency(calc.results.minTotalProfit)} - ${formatBDCurrency(calc.results.maxTotalProfit)}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-bank me-2"></i>Total Return:</span>
                  <span class="fw-bold">${formatBDCurrency(calc.results.minFinalValue)} - ${formatBDCurrency(calc.results.maxFinalValue)}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-cash me-2"></i>12-Month Projection:</span>
                  <span class="fw-bold">${formatBDCurrency(calc.results.min12MonthProfit)} - ${formatBDCurrency(calc.results.max12MonthProfit)}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span><i class="bi bi-wallet2 me-2"></i>12-Month Total Return:</span>
                  <span class="fw-bold">${formatBDCurrency(calc.results.min12MonthTotal)} - ${formatBDCurrency(calc.results.max12MonthTotal)}</span>
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
      });
    } catch (e) {
      console.log("Error displaying saved calculations:", e);
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

  // Function to save the current calculation
  function saveCurrentCalculation() {
    try {
      const merchant = document.getElementById("merchant").value;
      const project = document.getElementById("project").value;

      if (!project) {
        alert("Please enter a project name before saving.");
        return;
      }

      // Get the current calculation data from localStorage
      const currentCalculation = JSON.parse(localStorage.getItem("currentCalculation") || "{}");

      if (!currentCalculation.inputs) {
        alert("Please calculate the results before saving.");
        return;
      }

      // Add merchant and project to the calculation data
      currentCalculation.merchant = merchant;
      currentCalculation.project = project;
      currentCalculation.favorite = false; // Initialize favorite status

      // Get existing saved calculations
      const savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");

      // Check if a calculation with the same project name already exists
      const existingIndex = savedCalculations.findIndex((calc) => calc.merchant === merchant && calc.project === project);

      if (existingIndex !== -1) {
        if (confirm("A calculation with this project name already exists. Do you want to update it?")) {
          // Preserve favorite status when updating
          currentCalculation.favorite = savedCalculations[existingIndex].favorite || false;
          savedCalculations[existingIndex] = currentCalculation;
        } else {
          return;
        }
      } else {
        // Add the current calculation to the beginning of the array
        savedCalculations.unshift(currentCalculation);
      }

      // Update localStorage
      localStorage.setItem("savedCalculations", JSON.stringify(savedCalculations));

      // Refresh the display
      displaySavedCalculations();

      // Show success message
      alert("Calculation saved successfully!");

      // Reset the form
      document.getElementById("resetCalculator").click();
    } catch (e) {
      console.log("Error saving calculation:", e);
      alert("Error saving calculation. Please try again.");
    }
  }

  // Calculator functionality
  const calculateForm = document.getElementById("calculatorForm");

  calculateForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form submission
    calculateResults();
  });

  function calculateResults() {
    // Get input values
    const merchant = document.getElementById("merchant").value;
    const project = document.getElementById("project").value;
    const minEarning = parseFloat(document.getElementById("minEarning").value) || 0;
    const maxEarning = parseFloat(document.getElementById("maxEarning").value) || 0;
    const duration = parseInt(document.getElementById("duration").value) || 0;
    const investment = parseFloat(document.getElementById("investment").value) || 0;

    // Validate inputs
    if (minEarning <= 0 || maxEarning <= 0 || duration <= 0 || investment <= 0) {
      alert("Please enter valid positive numbers for all fields.");
      return;
    }

    if (minEarning > maxEarning) {
      alert("Minimum earning percentage cannot be greater than maximum.");
      return;
    }

    // Update duration display in results
    document.getElementById("displayDuration").textContent = duration;
    document.getElementById("displayDuration2").textContent = duration;

    // Calculate min and max profit based on EEP percentages over the project duration
    // EEP is for the entire duration, not per month
    const minTotalProfit = investment * (minEarning / 100);
    const maxTotalProfit = investment * (maxEarning / 100);

    // Calculate min and max final investment value after project completion
    const minFinalValue = investment + minTotalProfit;
    const maxFinalValue = investment + maxTotalProfit;

    // Calculate yearly return rates (simple doubling for exact 6-month periods)
    const minYearlyReturnRate = duration === 6 ? minEarning * 2 : minEarning * (12 / duration);
    const maxYearlyReturnRate = duration === 6 ? maxEarning * 2 : maxEarning * (12 / duration);

    // Calculate 12-month projections
    const min12MonthProfit = investment * (minYearlyReturnRate / 100);
    const max12MonthProfit = investment * (maxYearlyReturnRate / 100);
    const min12MonthTotal = investment + min12MonthProfit;
    const max12MonthTotal = investment + max12MonthProfit;

    // Display results as ranges with proper formatting
    document.getElementById("yearlyReturnRateRange").textContent = minYearlyReturnRate.toFixed(2) + "% - " + maxYearlyReturnRate.toFixed(2) + "%";

    document.getElementById("totalProfitRange").textContent = formatBDCurrency(minTotalProfit) + " - " + formatBDCurrency(maxTotalProfit);

    document.getElementById("finalValueRange").textContent = formatBDCurrency(minFinalValue) + " - " + formatBDCurrency(maxFinalValue);

    document.getElementById("twelveMonthRange").textContent = formatBDCurrency(min12MonthProfit) + " - " + formatBDCurrency(max12MonthProfit);

    document.getElementById("twelveMonthTotalRange").textContent = formatBDCurrency(min12MonthTotal) + " - " + formatBDCurrency(max12MonthTotal);

    // Check if we're editing an existing calculation
    const editingIndex = localStorage.getItem("editingIndex");
    if (editingIndex !== null) {
      // Get existing calculations
      const savedCalculations = JSON.parse(localStorage.getItem("savedCalculations") || "[]");

      // Preserve favorite status
      const favorite = savedCalculations[editingIndex].favorite || false;

      // Update the calculation at the specified index
      savedCalculations[editingIndex] = {
        merchant,
        project,
        inputs: {
          minEarning,
          maxEarning,
          duration,
          investment,
        },
        results: {
          minYearlyReturnRate,
          maxYearlyReturnRate,
          minTotalProfit,
          maxTotalProfit,
          minFinalValue,
          maxFinalValue,
          min12MonthProfit,
          max12MonthProfit,
          min12MonthTotal,
          max12MonthTotal,
        },
        favorite, // Preserve favorite status
        timestamp: new Date().toISOString(),
      };

      // Save back to localStorage
      localStorage.setItem("savedCalculations", JSON.stringify(savedCalculations));

      // Clear editing state
      localStorage.removeItem("editingIndex");

      // Reset calculate button text
      const calculateButton = document.getElementById("calculate");
      calculateButton.innerHTML = '<i class="bi bi-calculator me-2"></i>Calculate Profit';
    } else {
      // Save as new calculation
      try {
        const calculationData = {
          merchant,
          project,
          inputs: {
            minEarning,
            maxEarning,
            duration,
            investment,
          },
          results: {
            minYearlyReturnRate,
            maxYearlyReturnRate,
            minTotalProfit,
            maxTotalProfit,
            minFinalValue,
            maxFinalValue,
            min12MonthProfit,
            max12MonthProfit,
            min12MonthTotal,
            max12MonthTotal,
          },
          favorite: false, // Initialize favorite status for new calculations
          timestamp: new Date().toISOString(),
        };

        // Save current calculation
        localStorage.setItem("currentCalculation", JSON.stringify(calculationData));
      } catch (e) {
        console.log("Error saving to localStorage:", e);
      }
    }

    // Show results section
    document.getElementById("results").style.display = "block";

    // Refresh the saved calculations display
    displaySavedCalculations();
  }

  // Add event listener for save calculation button
  document.getElementById("saveCalculation").addEventListener("click", saveCurrentCalculation);

  // Modify reset button to also clear editing state
  document.getElementById("resetCalculator").addEventListener("click", function () {
    // Clear all input fields
    document.getElementById("merchant").value = "biniyog.io";
    document.getElementById("project").value = "";
    document.getElementById("minEarning").value = "";
    document.getElementById("maxEarning").value = "";
    document.getElementById("duration").value = "";
    document.getElementById("investment").value = "";

    // Hide results section
    document.getElementById("results").style.display = "none";

    // Clear editing state
    localStorage.removeItem("editingIndex");

    // Reset calculate button text
    const calculateButton = document.getElementById("calculate");
    calculateButton.innerHTML = '<i class="bi bi-calculator me-2"></i>Calculate Profit';

    // Focus on first input field
    document.getElementById("project").focus();
  });

  // Display saved calculations on page load
  displaySavedCalculations();
});
