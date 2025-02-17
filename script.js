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

if (resetDatabase) { uploads = []; }  // Reset if needed

// ---------------- Helper: Read File as Data URL ----------------
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
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
    // Also show normal game entries (if any)
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
  modal.style.display = "block";
});
uploadClose.addEventListener("click", () => {
  modal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === modal) {
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
     // Ensure only soloName is required.
     document.getElementById("soloName").required = true;
     document.getElementById("teamName").required = false;
     teamMembersDiv.innerHTML = "";
   } else {
     soloFields.style.display = "none";
     teamFields.style.display = "block";
     // Ensure only teamName and teamMembers are required.
     document.getElementById("soloName").required = false;
     document.getElementById("teamName").required = true;
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
// ---------------- Configuration for GitHub Data Storage ----------------
const GITHUB_USER = "Firereader05";
const REPO_NAME = "Game_Jam";
const DATA_FILE_PATH = "data.json";
const GITHUB_TOKEN = "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"; // Insecure in production

// The GitHub API endpoint for the file
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;

// We'll keep a local cache of the data here
let uploads = [];

// Keep track of the latest SHA so we can commit updates
let latestSha = null;

// How often to poll (in milliseconds)
const POLL_INTERVAL = 10000; // 10 seconds

// ---------------- Initial Data Load & Polling ----------------

// 1) Load data once on page load
loadDataFromGitHub()
  .then(() => {
    updateGameList(); // Render after initial load
    startPolling();   // Start periodic polling
  })
  .catch((err) => {
    console.error("Error loading initial data:", err);
  });

// 2) Start polling for changes
function startPolling() {
  setInterval(() => {
    loadDataFromGitHub().then(() => {
      updateGameList();
    });
  }, POLL_INTERVAL);
}

// ---------------- Functions to Read/Write GitHub ----------------

// Load the data.json from GitHub
async function loadDataFromGitHub() {
  // GET request to retrieve the file content + SHA
  const response = await fetch(GITHUB_API_URL, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data.json: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // data.content is Base64-encoded JSON
  const content = atob(data.content); // decode base64
  const parsed = JSON.parse(content);
  uploads = parsed; // store in our global array

  // Keep the SHA for committing changes
  latestSha = data.sha;
}

// Commit the updated array to GitHub
async function commitDataToGitHub(updatedArray) {
  const newContent = JSON.stringify(updatedArray, null, 2); // pretty print
  const base64Content = btoa(newContent); // encode to base64

  const response = await fetch(GITHUB_API_URL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update data.json",
      content: base64Content,
      sha: latestSha, // required so GitHub knows we're updating the latest version
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Failed to commit data.json: ${response.status} ${response.statusText}, ${err.message}`);
  }

  const responseData = await response.json();
  // Update our stored SHA to the new commit's SHA
  latestSha = responseData.content.sha;
}

// ---------------- Handle Form Submission (Override) ----------------
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Gather form data (same as before)
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

  // Process image file
  const fileInput = document.getElementById("gameImage");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select an image file.");
    return;
  }

  try {
    const gameImageData = await readFileAsDataURL(file);

    // Create new entry
    const gameEntry = {
      entryType,
      names,
      gameName,
      gameImageData,
      gameDescription,
      shareUrl,
      submittedAt: new Date().toISOString(),
      score: 0,
    };

    // 1) Load fresh data from GitHub to ensure we have the latest
    await loadDataFromGitHub();

    // 2) Push new entry locally
    uploads.push(gameEntry);

    // 3) Commit updated array to GitHub
    await commitDataToGitHub(uploads);

    // 4) Re-render
    updateGameList();

    // 5) Close modal, reset form
    modal.style.display = "none";
    uploadForm.reset();
    updateFormFields();

    alert("Game uploaded successfully!");
  } catch (error) {
    console.error("Error uploading game:", error);
    alert("There was an error uploading your game. See console for details.");
  }
});

// ---------------- Display Functions ----------------
function updateGameList() {
  // Used during the jam (normal display, not sorted by score)
  const gameList = document.getElementById("gameList");
  gameList.innerHTML = "";
  uploads.forEach((entry) => {
    // Show each game entry (clickable to see details)
    const entryDiv = document.createElement("div");
    entryDiv.className = "game-entry";
    const img = document.createElement("img");
    img.src = entry.gameImageData;
    img.alt = entry.gameName;
    entryDiv.appendChild(img);
    const desc = document.createElement("p");
    desc.textContent = entry.gameDescription;
    entryDiv.appendChild(desc);
    entryDiv.addEventListener("click", () => {
      openDetailModal(entry);
    });
    gameList.appendChild(entryDiv);
  });
}

function updateLeaderboard() {
  // After jam ends: sort entries by score descending
  const sortedUploads = uploads.slice().sort((a, b) => b.score - a.score);
  const gameList = document.getElementById("gameList");
  gameList.innerHTML = "";
  sortedUploads.forEach((entry, index) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "leaderboard-entry";
    if (index === 0) entryDiv.classList.add("top1");
    else if (index === 1) entryDiv.classList.add("top2");
    else if (index === 2) entryDiv.classList.add("top3");

    const img = document.createElement("img");
    img.src = entry.gameImageData;
    img.alt = entry.gameName;
    entryDiv.appendChild(img);

    const nameP = document.createElement("p");
    nameP.textContent = entry.gameName;
    entryDiv.appendChild(nameP);

    const descP = document.createElement("p");
    descP.textContent = entry.gameDescription;
    entryDiv.appendChild(descP);

    const scoreP = document.createElement("p");
    scoreP.textContent = "Score: " + entry.score;
    entryDiv.appendChild(scoreP);

    gameList.appendChild(entryDiv);
  });
}

// ---------------- Detail Modal Functionality ----------------
const detailModal = document.getElementById("detailModal");
const detailCloseBtn = document.querySelector(".detail-close");
const detailContent = document.getElementById("detailContent");

// Inside openDetailModal
function openDetailModal(entry) {
  detailContent.innerHTML = "";
  const img = document.createElement("img");
  img.src = entry.gameImageData;
  img.alt = entry.gameName;
  detailContent.appendChild(img);

  const desc = document.createElement("p");
  desc.textContent = entry.gameDescription;
  detailContent.appendChild(desc);

  // Create a styled "Play Game" button
  const link = document.createElement("a");
  link.href = entry.shareUrl;
  link.textContent = "Play Game";
  link.target = "_blank";
  link.classList.add("playBtn");
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
  // List each game entry with an input for score.
  uploads.forEach((entry, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    const label = document.createElement("label");
    label.textContent = `${entry.gameName} (Current score: ${entry.score}): `;
    label.style.marginRight = "10px";
    const input = document.createElement("input");
    input.type = "number";
    input.value = entry.score;
    input.dataset.index = index; // store index for later
    div.appendChild(label);
    div.appendChild(input);
    leaderboardEditContainer.appendChild(div);
  });
}

editLeaderboardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // For each input, update the corresponding score.
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
