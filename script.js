// ---------------- Configuration Variables ----------------
const showUploadBeforeJam = true;  // Show upload button before start?
const resetDatabase = false;          // Reset uploads on page load?
const adminPassword = "admin123";     // Change this to your secret password

// ---------------- Calculate Jam Timing ----------------
const now = new Date();
let dayOfWeek = now.getDay();
let offset = (3 - dayOfWeek + 7) % 7;
if (offset === 0) offset = 7;
const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
startDate.setHours(0, 0, 0, 0);
const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

// ---------------- Global Upload Data ----------------
let uploads = [];
if (resetDatabase) { uploads = []; }  // Reset if needed

// ---------------- Helper: Read File as Data URL ----------------
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

// ---------------- Countdown & UI Updates ----------------
const countdownEl = document.getElementById("countdown");
const uploadBtn = document.getElementById("uploadBtn");
const editLeaderboardBtn = document.getElementById("editLeaderboardBtn");

setInterval(() => {
  const current = new Date();
  if (current < startDate) {
    // Before jam starts
    uploadBtn.style.display = showUploadBeforeJam ? "inline-block" : "none";
    countdownEl.innerHTML = "Game Jam starts in: " + formatTime(startDate - current);
    updateGameList();
  } else if (current >= startDate && current < endDate) {
    // During the jam
    uploadBtn.style.display = "inline-block";
    countdownEl.innerHTML = "Game Jam ends in: " + formatTime(endDate - current);
    updateGameList();
  } else {
    // After jam ends: hide upload button and show leaderboard
    uploadBtn.style.display = "none";
    countdownEl.innerHTML = "Game Jam has ended!";
    updateLeaderboard();
    editLeaderboardBtn.style.display = "inline-block";
  }
}, 1000);

function formatTime(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ---------------- Modal & Form Functionality ----------------
const modal = document.getElementById("uploadModal");
const uploadClose = document.getElementById("uploadClose");
const uploadForm = document.getElementById("uploadForm");

uploadBtn.addEventListener("click", () => {
  console.log("Upload button clicked. Opening modal.");
  modal.style.display = "block";
});
uploadClose.addEventListener("click", () => {
  console.log("Upload modal closed via close button.");
  modal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    console.log("Upload modal closed by clicking outside.");
    modal.style.display = "none";
  }
});

// ---------------- Form Logic for Solo/Team Fields ----------------
const entryTypeEl = document.getElementById("entryType");
const soloFields = document.getElementById("soloFields");
const teamFields = document.getElementById("teamFields");
const teamMembersDiv = document.getElementById("teamMembers");

function updateFormFields() {
  const type = entryTypeEl.value;
  if (type === "solo") {
    soloFields.style.display = "block";
    teamFields.style.display = "none";
    teamMembersDiv.innerHTML = "";
  } else {
    soloFields.style.display = "none";
    teamFields.style.display = "block";
    let membersCount = (type === "duo") ? 2 : 3;
    teamMembersDiv.innerHTML = "";
    for (let i = 1; i <= membersCount; i++) {
      const label = document.createElement("label");
      label.setAttribute("for", `teamMember${i}`);
      label.textContent = `Team Member ${i} Name:`;
      const input = document.createElement("input");
      input.type = "text";
      input.id = `teamMember${i}`;
      input.name = `teamMember${i}`;
      input.required = true;
      teamMembersDiv.appendChild(label);
      teamMembersDiv.appendChild(input);
    }
  }
}
entryTypeEl.addEventListener("change", updateFormFields);
updateFormFields();

// ---------------- Handle Form Submission ----------------
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Submit event triggered.");
  
    // Gather form data.
    const entryType = entryTypeEl.value;
    let names = {};
    if (entryType === "solo") {
      names.soloName = document.getElementById("soloName").value;
    } else {
      names.teamName = document.getElementById("teamName").value;
      names.teamMembers = [];
      document.querySelectorAll("#teamMembers input").forEach(input => {
        names.teamMembers.push(input.value);
      });
    }
    const gameName = document.getElementById("gameName").value;
    const gameDescription = document.getElementById("gameDescription").value;
    const shareUrl = document.getElementById("shareUrl").value;
  
    // Process image file.
    const fileInput = document.getElementById("gameImage");
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select an image file.");
      return;
    }
    console.log("Reading file:", file);
  
    readFileAsDataURL(file)
      .then((gameImageData) => {
        console.log("File read successfully.");
        const gameEntry = {
          entryType,
          names,
          gameName,
          gameImageData,
          gameDescription,
          shareUrl,
          submittedAt: new Date(),
          score: 0  // Default score
        };
        uploads.push(gameEntry);
        console.log("New game entry added:", gameEntry);
        updateGameList();  // Ensure the game list is updated
        modal.style.display = "none";
        uploadForm.reset();
        updateFormFields();
      })
      .catch((error) => {
        console.error("Error reading file:", error);
        alert("There was an error processing your image file.");
      });
  });
  
  // ---------------- Display Functions ----------------
  function updateGameList() {
    const gameList = document.getElementById("gameList");
    console.log("Updating game list...");
    gameList.innerHTML = "";
    uploads.forEach((entry, index) => {
      console.log(`Adding entry ${index + 1}:`, entry);
      const entryDiv = document.createElement("div");
      entryDiv.className = "game-entry";
  
      const img = document.createElement("img");
      img.src = entry.gameImageData;
      img.alt = entry.gameName;
      img.style.width = "100px"; // Adjust the size as needed
      img.style.height = "100px"; // Adjust the size as needed
      entryDiv.appendChild(img);
  
      const name = document.createElement("h3");
      name.textContent = entry.gameName;
      entryDiv.appendChild(name);
  
      const desc = document.createElement("p");
      desc.textContent = entry.gameDescription;
      entryDiv.appendChild(desc);
  
      entryDiv.addEventListener("click", () => {
        openDetailModal(entry);
      });
  
      gameList.appendChild(entryDiv);
    });
  }

// ---------------- Detail Modal Functionality ----------------
const detailModal = document.getElementById("detailModal");
const detailCloseBtn = document.querySelector(".detail-close");
const detailContent = document.getElementById("detailContent");

function openDetailModal(entry) {
  detailContent.innerHTML = "";
  const img = document.createElement("img");
  img.src = entry.gameImageData;
  img.alt = entry.gameName;
  detailContent.appendChild(img);
  const desc = document.createElement("p");
  desc.textContent = entry.gameDescription;
  detailContent.appendChild(desc);
  const link = document.createElement("a");
  link.href = entry.shareUrl;
  link.textContent = "Play Game";
  link.target = "_blank";
  detailContent.appendChild(link);
  detailModal.style.display = "block";
}
detailCloseBtn.addEventListener("click", () => {
  detailModal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === detailModal) {
    detailModal.style.display = "none";
  }
});

// ---------------- Leaderboard Edit Functionality ----------------
const editLeaderboardModal = document.getElementById("editLeaderboardModal");
const editLeaderboardClose = document.getElementById("editLeaderboardClose");
const editLeaderboardForm = document.getElementById("editLeaderboardForm");
const leaderboardEditContainer = document.getElementById("leaderboardEditContainer");

editLeaderboardBtn.addEventListener("click", () => {
  const password = prompt("Enter admin password:");
  if (password === adminPassword) {
    populateEditLeaderboard();
    editLeaderboardModal.style.display = "block";
  } else {
    alert("Incorrect password.");
  }
});
editLeaderboardClose.addEventListener("click", () => {
  editLeaderboardModal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === editLeaderboardModal) {
    editLeaderboardModal.style.display = "none";
  }
});

function populateEditLeaderboard() {
  leaderboardEditContainer.innerHTML = "";
  uploads.forEach((entry, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    const label = document.createElement("label");
    label.textContent = `${entry.gameName} (Current score: ${entry.score}): `;
    label.style.marginRight = "10px";
    const input = document.createElement("input");
    input.type = "number";
    input.value = entry.score;
    input.dataset.index = index;
    div.appendChild(label);
    div.appendChild(input);
    leaderboardEditContainer.appendChild(div);
  });
}

editLeaderboardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = leaderboardEditContainer.querySelectorAll("input");
  inputs.forEach(input => {
    const idx = input.dataset.index;
    const newScore = parseInt(input.value, 10);
    if (!isNaN(newScore)) {
      uploads[idx].score = newScore;
    }
  });
  editLeaderboardModal.style.display = "none";
  updateLeaderboard();
});
