function invcalc_toggleMode() {
  const mode = document.querySelector('input[name="invcalc_mode"]:checked').value;
  const projectionInputs = document.getElementById("invcalc_projection_inputs");
  const goalInputs = document.getElementById("invcalc_goal_inputs");
  const results = document.getElementById("invcalc_results");
  const error = document.getElementById("invcalc_error");
  const goalInvestment = document.getElementById("invcalc_goal_investment");
  const form = document.getElementById("invcalc_form");

  if (!projectionInputs || !goalInputs || !results || !error || !form || !goalInvestment) {
    console.error("Required elements not found in the DOM");
    return;
  }

  if (mode === "projection") {
    projectionInputs.classList.remove("invcalc_hidden");
    goalInputs.classList.add("invcalc_hidden");
    goalInvestment.classList.add("invcalc_hidden");
  } else {
    projectionInputs.classList.add("invcalc_hidden");
    goalInputs.classList.remove("invcalc_hidden");
    goalInvestment.classList.remove("invcalc_hidden");
  }

  results.classList.add("invcalc_hidden");
  error.classList.add("invcalc_hidden");
  form.reset();
}

document.addEventListener("DOMContentLoaded", function () {
  const projectionInputs = document.getElementById("invcalc_projection_inputs");
  const goalInputs = document.getElementById("invcalc_goal_inputs");
  const results = document.getElementById("invcalc_results");
  const error = document.getElementById("invcalc_error");
  const form = document.getElementById("invcalc_form");

  if (!projectionInputs || !goalInputs || !results || !error || !form) {
    console.error("Required elements not found in the DOM");
    return;
  }

  const modeRadios = document.querySelectorAll('input[name="invcalc_mode"]');
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", invcalc_toggleMode);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    invcalc_calculate();
  });

  invcalc_toggleMode();

  const inputs = document.querySelectorAll(".invcalc_input");
  inputs.forEach((input) => {
    input.addEventListener(
      "touchstart",
      function (e) {
        // Handle touch events if needed
      },
      { passive: true }
    );
  });
});

function invcalc_formatBangladeshiNumber(number) {
  if (isNaN(number) || number === null || number === undefined) {
    return "0";
  }
  const numStr = number.toString();
  const [integerPart, decimalPart] = numStr.split(".");
  let formattedInteger = integerPart.replace(/\D/g, "");
  if (!formattedInteger) return decimalPart ? "0." + decimalPart : "0";
  const len = formattedInteger.length;
  if (len <= 3) {
    formattedInteger = formattedInteger;
  } else if (len <= 5) {
    formattedInteger = formattedInteger.slice(0, len - 3) + "," + formattedInteger.slice(len - 3);
  } else {
    let result = formattedInteger.slice(len - 3);
    let remaining = formattedInteger.slice(0, len - 3);
    while (remaining.length > 0) {
      if (remaining.length <= 2) {
        result = remaining + "," + result;
        break;
      } else {
        result = remaining.slice(remaining.length - 2) + "," + result;
        remaining = remaining.slice(0, remaining.length - 2);
      }
    }
    formattedInteger = result;
  }
  return decimalPart ? formattedInteger + "." + decimalPart : formattedInteger;
}

function invcalc_formatInputAsBangladeshiNumber(input) {
  const cursorPosition = input.selectionStart;
  const originalValue = input.value;
  const originalLength = originalValue.length;
  let value = originalValue.replace(/[^0-9.-]/g, "");
  if (value.startsWith("-")) {
    value = "-" + value.substring(1).replace(/-/g, "");
  } else {
    value = value.replace(/-/g, "");
  }
  const parts = value.split(".");
  value = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
  let sign = "";
  let numberPart = value;
  if (value.startsWith("-")) {
    sign = "-";
    numberPart = value.substring(1);
  }
  const numParts = numberPart.split(".");
  let integerPart = numParts[0];
  const decimalPart = numParts.length > 1 ? "." + numParts[1] : "";
  const formattedInteger = invcalc_formatBangladeshiNumber(integerPart);
  const formattedValue = sign + formattedInteger + decimalPart;
  input.value = formattedValue;
  const newLength = formattedValue.length;
  let newCursorPosition = cursorPosition + (newLength - originalLength);
  const commasBeforeCursorOriginal = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
  const commasBeforeCursorNew = (formattedValue.substring(0, newCursorPosition).match(/,/g) || []).length;
  newCursorPosition += commasBeforeCursorNew - commasBeforeCursorOriginal;
  newCursorPosition = Math.max(0, Math.min(newLength, newCursorPosition));
  setTimeout(() => {
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }, 0);
}

function invcalc_sanitizeInput(input) {
  return input.replace(/[^0-9.-]/g, "").replace(/(\..*?)\./g, "$1");
}

function invcalc_validateInputs(mode, inputs) {
  const errors = [];
  const years = parseInt(inputs.years);
  const monthlyInvestment = parseFloat(inputs.monthlyInvestment);
  const yearlyIncrease = parseFloat(inputs.yearlyIncrease);
  const targetAmount = parseFloat(inputs.targetAmount);
  const initialProfit = parseFloat(inputs.initialProfit);
  const profitIncrease = parseFloat(inputs.profitIncrease);

  if (isNaN(years)) {
    errors.push("Years must be a valid number.");
  } else if (years <= 0 || years > 100) {
    errors.push("Years must be a positive number between 1 and 100.");
  }

  if (isNaN(initialProfit)) {
    errors.push("Initial Profit % must be a valid number.");
  } else if (initialProfit < -50 || initialProfit > 100) {
    errors.push("Initial Profit % must be between -50 and 100.");
  }

  if (isNaN(profitIncrease)) {
    errors.push("Profit Increase % must be a valid number.");
  } else if (profitIncrease < -10 || profitIncrease > 10) {
    errors.push("Profit Increase % must be between -10 and 10.");
  }

  if (mode === "projection") {
    if (isNaN(monthlyInvestment)) {
      errors.push("Initial Monthly Investment must be a valid number.");
    } else if (monthlyInvestment <= 0) {
      errors.push("Initial Monthly Investment must be a positive number.");
    }
  } else {
    if (isNaN(targetAmount)) {
      errors.push("Target Amount must be a valid number.");
    } else if (targetAmount <= 0) {
      errors.push("Target Amount must be a positive number.");
    }
  }

  if (isNaN(yearlyIncrease)) {
    errors.push("Yearly Investment Increase % must be a valid number.");
  } else if (yearlyIncrease < -10 || yearlyIncrease > 50) {
    errors.push("Yearly Investment Increase % must be between -10% and 50%.");
  }

  return errors;
}

class Investment {
  constructor(amount, startMonth, startYear, rate) {
    this.amount = amount;
    this.startMonth = startMonth;
    this.startYear = startYear;
    this.rate = rate;
  }

  getValueAt(month, year, withProfit = true) {
    const monthsPassed = (year - this.startYear) * 12 + (month - this.startMonth);
    if (monthsPassed < 0) return 0;

    if (monthsPassed === 0) return this.amount;

    let value = this.amount;
    if (withProfit && monthsPassed >= 12) {
      const fullYearsPassed = Math.floor(monthsPassed / 12);
      value *= Math.pow(1 + this.rate, fullYearsPassed);
    }

    return value;
  }
}

function invcalc_calcMonthlyBreakdown(initialMonthlyInvestment, years, initialRate, yearlyRateIncrease, yearlyInvestmentIncrease, reinvestProfits) {
  const results = [];
  let totalInvested = 0;
  let totalReinvestedProfits = 0;
  let currentMonthlyInvestment = initialMonthlyInvestment;

  const startMonth = new Date().getMonth();

  // First year (partial year from April)
  const firstYearMonths = 12 - startMonth;
  const firstYearInvestment = currentMonthlyInvestment * firstYearMonths;
  totalInvested = firstYearInvestment;

  results.push({
    year: 1,
    yearlyInvestment: firstYearInvestment,
    totalInvested: totalInvested,
    totalValue: totalInvested,
    profit: 0,
    yearlyProfit: 0,
    growthRate: 0,
  });

  // Calculate subsequent years
  let previousYearValue = totalInvested;
  let previousYearProfit = 0;

  for (let year = 1; year < years; year++) {
    // Increase monthly investment by yearly rate
    currentMonthlyInvestment *= 1 + yearlyInvestmentIncrease;

    // Add new investment for the current year
    const yearlyInvestment = currentMonthlyInvestment * 12;

    // Calculate profit rate for this year
    const currentRate = initialRate + (year - 1) * yearlyRateIncrease;

    // Calculate profit on previous year's total value
    const yearlyProfit = (previousYearValue * currentRate) / 100;

    // If reinvesting profits, add previous year's profit to total invested
    if (reinvestProfits) {
      totalReinvestedProfits += previousYearProfit;
      totalInvested = totalInvested + yearlyInvestment + previousYearProfit;
    } else {
      totalInvested += yearlyInvestment;
    }

    // Calculate total value including all investments and profits
    const totalValue = totalInvested + yearlyProfit;

    // Calculate growth rate based on original investment (excluding reinvested profits)
    const originalInvestment = totalInvested - totalReinvestedProfits;
    const growthRate = (totalValue / originalInvestment) * 100 - 100;

    results.push({
      year: year + 1,
      yearlyInvestment: yearlyInvestment,
      totalInvested: originalInvestment,
      totalValue: totalValue,
      profit: totalValue - originalInvestment,
      yearlyProfit: yearlyProfit,
      growthRate: growthRate,
    });

    previousYearValue = totalValue;
    previousYearProfit = yearlyProfit;
  }

  // Calculate final total asset growth rate
  const finalValue = results[results.length - 1].totalValue;
  const originalInvestment = results[results.length - 1].totalInvested;
  const totalAssetGrowthRate = (finalValue / originalInvestment) * 100 - 100;

  return {
    yearlySummary: results,
    finalAmount: finalValue,
    totalInvested: originalInvestment,
    totalProfit: finalValue - originalInvestment,
    totalAssetGrowthRate: totalAssetGrowthRate,
  };
}

function invcalc_calculate() {
  const mode = document.querySelector('input[name="invcalc_mode"]:checked').value;
  const reinvestProfits = document.getElementById("invcalc_reinvest_profits").checked;
  const errorDiv = document.getElementById("invcalc_error");
  const resultsDiv = document.getElementById("invcalc_results");
  const goalInvestmentDiv = document.getElementById("invcalc_goal_investment");

  if (!errorDiv || !resultsDiv || !goalInvestmentDiv) {
    console.error("Required elements not found in the DOM");
    return;
  }

  const inputs = {
    monthlyInvestment: invcalc_sanitizeInput(document.getElementById("invcalc_monthly_investment")?.value || "0"),
    yearlyIncrease: invcalc_sanitizeInput(mode === "projection" ? document.getElementById("invcalc_yearly_increase").value : document.getElementById("invcalc_goal_yearly_increase").value),
    years: invcalc_sanitizeInput(document.getElementById("invcalc_years").value),
    targetAmount: invcalc_sanitizeInput(document.getElementById("invcalc_target_amount")?.value || "0"),
    initialProfit: invcalc_sanitizeInput(mode === "projection" ? document.getElementById("invcalc_initial_profit").value : document.getElementById("invcalc_goal_initial_profit").value),
    profitIncrease: invcalc_sanitizeInput(mode === "projection" ? document.getElementById("invcalc_profit_increase").value : document.getElementById("invcalc_goal_profit_increase").value),
  };

  const errors = invcalc_validateInputs(mode, inputs);

  if (errors.length > 0) {
    errorDiv.textContent = errors.join(" ");
    errorDiv.classList.remove("invcalc_hidden");
    resultsDiv.classList.add("invcalc_hidden");
    return;
  }

  errorDiv.classList.add("invcalc_hidden");

  const years = parseInt(inputs.years);
  let initialMonthlyInvestment = mode === "projection" ? parseFloat(inputs.monthlyInvestment) : 0;
  const yearlyIncreaseRate = parseFloat(inputs.yearlyIncrease) / 100 || 0;
  const initialProfit = parseFloat(inputs.initialProfit);
  const profitIncrease = parseFloat(inputs.profitIncrease);
  const targetAmount = mode === "goal" ? parseFloat(inputs.targetAmount) : 0;

  if (mode === "goal") {
    let low = 1;
    let high = targetAmount;
    let requiredMonthly = 0;
    let iterations = 0;
    let bestResult = null;
    const tolerance = targetAmount * 0.001; // 0.1% tolerance

    while (iterations < 100) {
      requiredMonthly = (low + high) / 2;

      const result = invcalc_calcMonthlyBreakdown(requiredMonthly, years, initialProfit, profitIncrease, yearlyIncreaseRate, reinvestProfits);

      const diff = result.finalAmount - targetAmount;

      if (Math.abs(diff) < tolerance) {
        bestResult = result;
        break;
      }

      if (diff < 0) {
        low = requiredMonthly;
      } else {
        high = requiredMonthly;
      }

      bestResult = result;
      iterations++;

      if (high - low < 1) break;
    }

    if (!bestResult) {
      errorDiv.textContent = "Could not determine required investment. Try different parameters.";
      errorDiv.classList.remove("invcalc_hidden");
      resultsDiv.classList.add("invcalc_hidden");
      return;
    }

    initialMonthlyInvestment = requiredMonthly;
    var result = bestResult;
  } else {
    var result = invcalc_calcMonthlyBreakdown(initialMonthlyInvestment, years, initialProfit, profitIncrease, yearlyIncreaseRate, reinvestProfits);
  }

  const finalAmount = result.finalAmount;
  const totalInvested = result.totalInvested;
  const totalProfit = result.totalProfit;
  const growthRate = totalInvested > 0 ? (finalAmount / totalInvested) * 100 - 100 : 0;
  const yearlySummary = result.yearlySummary;

  document.getElementById("invcalc_total_invested").textContent = invcalc_formatBangladeshiNumber(totalInvested.toFixed(0));
  document.getElementById("invcalc_final_amount").textContent = invcalc_formatBangladeshiNumber(finalAmount.toFixed(0));
  document.getElementById("invcalc_total_profit").textContent = invcalc_formatBangladeshiNumber(totalProfit.toFixed(0));
  document.getElementById("invcalc_total_growth_percent").textContent = totalInvested > 0 ? growthRate.toFixed(2) + "%" : "N/A";

  document.getElementById("invcalc_goal_investment").classList.toggle("invcalc_hidden", mode !== "goal");

  if (mode === "goal") {
    document.getElementById("invcalc_required_monthly").textContent = invcalc_formatBangladeshiNumber(initialMonthlyInvestment.toFixed(2));
  }

  const breakdownEl = document.getElementById("invcalc_breakdown_text");
  let breakdownHTML = "";
  if (mode === "projection") {
    breakdownHTML +=
      "<p>With an initial monthly investment of <strong>" +
      invcalc_formatBangladeshiNumber(initialMonthlyInvestment.toFixed(0)) +
      " BDT</strong>, increasing by <strong>" +
      (yearlyIncreaseRate * 100).toFixed(1) +
      "%</strong> annually" +
      (reinvestProfits ? " and reinvesting profits" : "") +
      ", your money will grow as follows:</p>";
  } else {
    breakdownHTML +=
      "<p>To reach your goal of <strong>" +
      invcalc_formatBangladeshiNumber(targetAmount.toFixed(0)) +
      " BDT</strong> in " +
      years +
      " years, you would need an initial monthly investment of <strong>" +
      invcalc_formatBangladeshiNumber(initialMonthlyInvestment.toFixed(0)) +
      " BDT</strong>. The breakdown below shows this scenario:</p>";
  }

  const milestones = [];
  const milestoneYears = [5, 10, 20];
  let finalSummaryAdded = false;

  milestoneYears.forEach((mYear) => {
    if (years >= mYear) {
      const milestoneData = yearlySummary.find((y) => y.year === mYear);
      if (milestoneData) {
        const growthM = milestoneData.totalInvested > 0 ? (milestoneData.totalValue / milestoneData.totalInvested) * 100 - 100 : 0;
        milestones.push(
          '<div class="invcalc_milestone">' +
            "<p><strong>After " +
            mYear +
            " years:</strong> Your investment will grow to <strong>" +
            invcalc_formatBangladeshiNumber(milestoneData.totalValue.toFixed(0)) +
            " BDT</strong>, " +
            "from a total invested amount of <strong>" +
            invcalc_formatBangladeshiNumber(milestoneData.totalInvested.toFixed(0)) +
            " BDT</strong>, " +
            "with a profit of <strong>" +
            invcalc_formatBangladeshiNumber(milestoneData.profit.toFixed(0)) +
            " BDT</strong>" +
            " (" +
            (growthM > 0 ? growthM.toFixed(2) + "% growth rate" : "N/A growth") +
            ").</p>" +
            "</div>"
        );
        if (years === mYear) {
          finalSummaryAdded = true;
        }
      }
    }
  });

  if (!finalSummaryAdded) {
    milestones.push(
      '<div class="invcalc_milestone">' +
        "<p><strong>After " +
        years +
        " years:</strong> Your total investment of <strong>" +
        invcalc_formatBangladeshiNumber(totalInvested.toFixed(0)) +
        " BDT</strong>" +
        "will grow to <strong>" +
        invcalc_formatBangladeshiNumber(finalAmount.toFixed(0)) +
        " BDT</strong>, " +
        "giving you a profit of <strong>" +
        invcalc_formatBangladeshiNumber(totalProfit.toFixed(0)) +
        " BDT</strong>" +
        " (" +
        (totalInvested > 0 ? growthRate.toFixed(2) + "% growth rate" : "N/A growth") +
        ").</p>" +
        "</div>"
    );
  }

  breakdownHTML += milestones.join("");
  breakdownEl.innerHTML = breakdownHTML;

  const tableBody = document.getElementById("invcalc_summary_table");
  tableBody.innerHTML = "";

  yearlySummary.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      (index + 1) +
      "</td>" +
      "<td>" +
      (new Date().getFullYear() + row.year - 1) +
      "</td>" +
      "<td>" +
      invcalc_formatBangladeshiNumber(row.yearlyInvestment.toFixed(0)) +
      "<br/>" +
      invcalc_formatBangladeshiNumber(row.totalInvested.toFixed(0)) +
      "</td>" +
      "<td>" +
      invcalc_formatBangladeshiNumber(row.totalValue.toFixed(0)) +
      "</td>" +
      "<td>" +
      invcalc_formatBangladeshiNumber(row.yearlyProfit.toFixed(0)) +
      "<br/>" +
      invcalc_formatBangladeshiNumber(row.profit.toFixed(0)) +
      "</td>" +
      "<td>" +
      (row.totalInvested > 0 ? row.growthRate.toFixed(2) + "%" : "N/A") +
      "</td>";
    tableBody.appendChild(tr);
  });

  resultsDiv.classList.remove("invcalc_hidden");
}
