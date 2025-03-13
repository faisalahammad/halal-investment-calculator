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
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
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
    const mobileRegex =
      /(android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile)/i;

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
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope,
            );
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

  // Calculator functionality
  const calculateForm = document.getElementById("calculatorForm");

  calculateForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form submission
    calculateResults();
  });

  function calculateResults() {
    // Get input values
    const minEarning =
      parseFloat(document.getElementById("minEarning").value) || 0;
    const maxEarning =
      parseFloat(document.getElementById("maxEarning").value) || 0;
    const duration = parseInt(document.getElementById("duration").value) || 0;
    const investment =
      parseFloat(document.getElementById("investment").value) || 0;

    // Validate inputs
    if (
      minEarning <= 0 ||
      maxEarning <= 0 ||
      duration <= 0 ||
      investment <= 0
    ) {
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
    const minYearlyReturnRate =
      duration === 6 ? minEarning * 2 : minEarning * (12 / duration);
    const maxYearlyReturnRate =
      duration === 6 ? maxEarning * 2 : maxEarning * (12 / duration);

    // Calculate 12-month projections
    const min12MonthProfit = investment * (minYearlyReturnRate / 100);
    const max12MonthProfit = investment * (maxYearlyReturnRate / 100);
    const min12MonthTotal = investment + min12MonthProfit;
    const max12MonthTotal = investment + max12MonthProfit;

    // Display results as ranges with proper formatting
    document.getElementById("yearlyReturnRateRange").textContent =
      minYearlyReturnRate.toFixed(2) +
      "% - " +
      maxYearlyReturnRate.toFixed(2) +
      "%";

    document.getElementById("totalProfitRange").textContent =
      formatBDCurrency(minTotalProfit) +
      " - " +
      formatBDCurrency(maxTotalProfit);

    document.getElementById("finalValueRange").textContent =
      formatBDCurrency(minFinalValue) + " - " + formatBDCurrency(maxFinalValue);

    document.getElementById("twelveMonthRange").textContent =
      formatBDCurrency(min12MonthProfit) +
      " - " +
      formatBDCurrency(max12MonthProfit);

    document.getElementById("twelveMonthTotalRange").textContent =
      formatBDCurrency(min12MonthTotal) +
      " - " +
      formatBDCurrency(max12MonthTotal);

    // Show results section
    document.getElementById("results").style.display = "block";

    // Save calculation to localStorage for offline use
    try {
      const calculationData = {
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
        timestamp: new Date().toISOString(),
      };

      // Save current calculation
      localStorage.setItem(
        "currentCalculation",
        JSON.stringify(calculationData),
      );

      // Save to history (keeping last 10 calculations)
      let history = JSON.parse(
        localStorage.getItem("calculationHistory") || "[]",
      );
      history.unshift(calculationData);
      history = history.slice(0, 10); // Keep only last 10
      localStorage.setItem("calculationHistory", JSON.stringify(history));
    } catch (e) {
      console.log("Error saving to localStorage:", e);
    }
  }

  // Add event listener for reset button
  document
    .getElementById("resetCalculator")
    .addEventListener("click", function () {
      // Clear all input fields
      document.getElementById("minEarning").value = "";
      document.getElementById("maxEarning").value = "";
      document.getElementById("duration").value = "";
      document.getElementById("investment").value = "";

      // Hide results section
      document.getElementById("results").style.display = "none";

      // Focus on first input field
      document.getElementById("minEarning").focus();
    });

  // Load last calculation from localStorage if available
  try {
    const savedCalculation = localStorage.getItem("currentCalculation");
    if (savedCalculation) {
      const data = JSON.parse(savedCalculation);

      // Only pre-fill if less than 24 hours old
      const savedTime = new Date(data.timestamp);
      const currentTime = new Date();
      const hoursDiff = (currentTime - savedTime) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Pre-fill input fields
        document.getElementById("minEarning").value = data.inputs.minEarning;
        document.getElementById("maxEarning").value = data.inputs.maxEarning;
        document.getElementById("duration").value = data.inputs.duration;
        document.getElementById("investment").value = data.inputs.investment;
      }
    }
  } catch (e) {
    console.log("Error loading from localStorage:", e);
  }
});
