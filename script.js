let allData = [];

// Load saved data
if (localStorage.getItem("healthData")) {
  allData = JSON.parse(localStorage.getItem("healthData"));
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("healthForm");
  const recommendationDiv = document.getElementById("recommendation");
  const statsList = document.getElementById("statsList");
  const clearAllBtn = document.getElementById("clearAll");
  const exportBtn = document.getElementById("exportData");
  const weeklyDiv = document.getElementById("weeklyAverages");

  // ===== BMI Calculator =====
  function calculateBMI(weight, height) {
    if (!weight || !height) return null;
    let heightM = height / 100; // convert cm → m
    return (weight / (heightM * heightM)).toFixed(1);
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 24.9) return "Normal weight";
    if (bmi < 29.9) return "Overweight";
    return "Obese";
  }

  // ===== Recommendations =====
  function generateRecommendation(data) {
    let msg = `Based on today’s input:<br><br>`;

    // Sleep
    msg += data.sleep < 7 
      ? `😴 You need more sleep (7–9 hrs is ideal).<br>` 
      : `✅ Great job on sleep!<br>`;

    // Exercise
    msg += data.exercise < 30 
      ? `🏃 Aim for at least 30 mins of activity.<br>` 
      : `💪 Nice workout effort!<br>`;

    // Diet
    if (data.diet.includes("vegan")) {
      msg += `🥗 Get protein from lentils, tofu, beans.<br>`;
    } else if (data.diet.includes("vegetarian")) {
      msg += `🥕 Balance dairy/eggs with fiber-rich foods.<br>`;
    } else if (data.diet.includes("omnivore")) {
      msg += `🍗 Balance meat with whole grains and veggies.<br>`;
    }

    // Ethnicity
    const eth = data.ethnicity;
    if (eth.includes("asian")) {
      msg += `🥛 Add calcium-rich foods (less dairy is common).<br>`;
    } else if (eth.includes("mediterranean")) {
      msg += `🐟 Keep olive oil, veggies, and fish in your meals.<br>`;
    } else if (eth.includes("african")) {
      msg += `🌽 Include traditional grains (millet, sorghum) for nutrition.<br>`;
    } else if (eth.includes("latino") || eth.includes("hispanic")) {
      msg += `🍅 Balance rice/beans with fresh vegetables.<br>`;
    } else if (eth.includes("indian")) {
      msg += `🥬 Use spices wisely, and include leafy greens + lentils.<br>`;
    } else if (eth.includes("nordic")) {
      msg += `🥔 Keep whole grains, fish, and root veggies in meals.<br>`;
    } else {
      msg += `🌍 General tip: balance protein, fiber, and hydration.<br>`;
    }

    // BMI
    if (data.bmi) {
      msg += `<br>⚖️ Your BMI: <b>${data.bmi}</b> (${bmiCategory(data.bmi)})<br>`;
    }

    return msg;
  }

  // ===== Stats List =====
  function updateStatsList() {
    statsList.innerHTML = "";
    allData.forEach((day, i) => {
      let li = document.createElement("li");
      li.innerHTML = `
        <span><b>Day ${i + 1}:</b> Sleep ${day.sleep} hrs, Exercise ${day.exercise} mins, Diet: ${day.diet}, Ethnicity: ${day.ethnicity}, BMI: ${day.bmi || "N/A"}</span>
        <span>
          <button class="action-btn edit-btn" onclick="editEntry(${i})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteEntry(${i})">Delete</button>
        </span>
      `;
      statsList.appendChild(li);
    });
  }

  // ===== Weekly Averages =====
  function updateWeeklyAverages() {
    if (allData.length === 0) {
      weeklyDiv.innerHTML = "No data yet.";
      return;
    }

    let last7 = allData.slice(-7);
    let avgSleep = (last7.reduce((sum, d) => sum + d.sleep, 0) / last7.length).toFixed(1);
    let avgExercise = (last7.reduce((sum, d) => sum + d.exercise, 0) / last7.length).toFixed(1);

    weeklyDiv.innerHTML = `
      🛌 Average Sleep (last 7 days): <b>${avgSleep} hrs</b><br>
      🏃 Average Exercise (last 7 days): <b>${avgExercise} mins</b>
    `;
  }

  // ===== Charts =====
  const sleepCtx = document.getElementById("sleepChart").getContext("2d");
  const exerciseCtx = document.getElementById("exerciseChart").getContext("2d");

  let sleepChart = new Chart(sleepCtx, {
    type: "line",
    data: {
      labels: allData.map((_, i) => `Day ${i + 1}`),
      datasets: [{
        label: "Hours of Sleep",
        data: allData.map(d => d.sleep),
        borderColor: "#2980b9",
        backgroundColor: "rgba(41, 128, 185, 0.1)",
        fill: true,
        tension: 0.3
      }]
    }
  });

  let exerciseChart = new Chart(exerciseCtx, {
    type: "line",
    data: {
      labels: allData.map((_, i) => `Day ${i + 1}`),
      datasets: [{
        label: "Minutes of Exercise",
        data: allData.map(d => d.exercise),
        borderColor: "#27ae60",
        backgroundColor: "rgba(39, 174, 96, 0.1)",
        fill: true,
        tension: 0.3
      }]
    }
  });

  function updateCharts() {
    sleepChart.data.labels = allData.map((_, i) => `Day ${i + 1}`);
    sleepChart.data.datasets[0].data = allData.map(d => d.sleep);
    sleepChart.update();

    exerciseChart.data.labels = allData.map((_, i) => `Day ${i + 1}`);
    exerciseChart.data.datasets[0].data = allData.map(d => d.exercise);
    exerciseChart.update();
  }

  // ===== Form Submit =====
  form.addEventListener("submit", e => {
    e.preventDefault();
    const sleep = parseInt(document.getElementById("sleep").value);
    const exercise = parseInt(document.getElementById("exercise").value);
    const diet = document.getElementById("diet").value.toLowerCase();
    const ethnicity = document.getElementById("ethnicity").value.toLowerCase();
    const height = parseFloat(document.getElementById("height").value);
    const weight = parseFloat(document.getElementById("weight").value);

    let bmi = calculateBMI(weight, height);

    let todayData = { sleep, exercise, diet, ethnicity, height, weight, bmi };
    allData.push(todayData);
    localStorage.setItem("healthData", JSON.stringify(allData));

    recommendationDiv.innerHTML = generateRecommendation(todayData);
    updateStatsList();
    updateCharts();
    updateWeeklyAverages();
    form.reset();
  });

  // ===== Export CSV =====
  exportBtn.addEventListener("click", () => {
    if (allData.length === 0) {
      alert("No data to export!");
      return;
    }

    let csv = "Day,Sleep,Exercise,Diet,Ethnicity,Height(cm),Weight(kg),BMI\n";
    allData.forEach((d, i) => {
      csv += `${i + 1},${d.sleep},${d.exercise},${d.diet},${d.ethnicity},${d.height},${d.weight},${d.bmi || ""}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "health_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ===== Clear All =====
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data?")) {
      allData = [];
      localStorage.removeItem("healthData");
      updateStatsList();
      updateCharts();
      updateWeeklyAverages();
      recommendationDiv.innerHTML = "All data cleared. Add new entries to start again.";
    }
  });

  // ===== Edit/Delete =====
  window.deleteEntry = function(i) {
    allData.splice(i, 1);
    localStorage.setItem("healthData", JSON.stringify(allData));
    updateStatsList();
    updateCharts();
    updateWeeklyAverages();
  };

  window.editEntry = function(i) {
    const entry = allData[i];
    document.getElementById("sleep").value = entry.sleep;
    document.getElementById("exercise").value = entry.exercise;
    document.getElementById("diet").value = entry.diet;
    document.getElementById("ethnicity").value = entry.ethnicity;
    document.getElementById("height").value = entry.height;
    document.getElementById("weight").value = entry.weight;

    // Remove old entry
    allData.splice(i, 1);
    localStorage.setItem("healthData", JSON.stringify(allData));
    updateStatsList();
    updateCharts();
    updateWeeklyAverages();
  };

  // ===== Load on Start =====
  updateStatsList();
  updateCharts();
  updateWeeklyAverages();
});
