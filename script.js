document.addEventListener("DOMContentLoaded", function() {
  // ---------------- Configuration Variables ----------------
  const showUploadBeforeJam = true;
  const adminPassword = "admin123";

  // ---------------- Calculate Jam Timing ----------------
  const now = new Date();
  const dayOfWeek = now.getDay();
  const offset = (3 - dayOfWeek + 7) % 7 || 7;
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  // ---------------- Global Upload Data ----------------
  let uploads = JSON.parse(localStorage.getItem("gameUploads") || "[]");

  // ---------------- Countdown & UI Updates ----------------
  const countdownEl = document.getElementById("countdown");
  const uploadBtn = document.getElementById("uploadBtn");
  const editLeaderboardBtn = document.getElementById("editLeaderboardBtn");

  setInterval(() => {
    const current = new Date();
    if (current < startDate) {
      uploadBtn.style.display = showUploadBeforeJam ? "inline-block" : "none";
      countdownEl.innerHTML = "Game Jam starts in: " + formatTime(startDate - current);
      updateGameList();
    } else if (current < endDate) {
      uploadBtn.style.display = "inline-block";
      countdownEl.innerHTML = "Game Jam ends in: " + formatTime(endDate - current);
      updateGameList();
    } else {
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

  // ---------------- Modal & Form Logic ----------------
  const modal = document.getElementById("uploadModal");
  const uploadClose = document.getElementById("uploadClose");
  const uploadForm = document.getElementById("uploadForm");

  uploadBtn.addEventListener("click", () => modal.style.display = "block");
  uploadClose.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });

  const entryTypeEl = document.getElementById("entryType");
  const soloFields = document.getElementById("soloFields");
  const teamFields = document.getElementById("teamFields");
  const teamMembersDiv = document.getElementById("teamMembers");

  entryTypeEl.addEventListener("change", () => {
    const type = entryTypeEl.value;
    const soloNameInput = document.getElementById("soloName");
    const teamNameInput = document.getElementById("teamName");
  
    soloFields.style.display = type === "solo" ? "block" : "none";
    teamFields.style.display = type !== "solo" ? "block" : "none";
  
    // Only mark required fields that are visible
    if (type === "solo") {
      soloNameInput.required = true;
      teamNameInput.required = false;
    } else {
      soloNameInput.required = false;
      teamNameInput.required = true;
    }
  
    teamMembersDiv.innerHTML = type !== "solo" ? "<label>Team Members:</label><input type='text' required>" : "";
  });
  
  // ---------------- Handle Form Submission ----------------
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const entryType = entryTypeEl.value;
    const names = entryType === "solo" ? { soloName: document.getElementById("soloName").value } : {
      teamName: document.getElementById("teamName").value,
      teamMembers: [...document.querySelectorAll("#teamMembers input")].map(input => input.value)
    };
    const gameName = document.getElementById("gameName").value;
    const gameDescription = document.getElementById("gameDescription").value;
    const shareUrl = document.getElementById("shareUrl").value;
    const file = document.getElementById("gameImage").files[0];

    if (!file) return alert("Please select an image file.");

    const reader = new FileReader();
    reader.onload = async () => {
      const gameEntry = {
        entryType,
        names,
        gameName,
        gameImageData: reader.result,
        gameDescription,
        shareUrl,
        submittedAt: new Date().toISOString(),
        score: 0
      };
      uploads.push(gameEntry);
      localStorage.setItem("gameUploads", JSON.stringify(uploads));
      modal.style.display = "none";
      uploadForm.reset();
      alert("Game uploaded successfully!");
      updateGameList();
    };
    reader.readAsDataURL(file);
  });

  // ---------------- Display Functions ----------------
  function updateGameList() {
    const gameList = document.getElementById("gameList");
    gameList.innerHTML = "";
    uploads.forEach((entry) => {
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
  const playButton = document.getElementById("playButton");
  
  function openDetailModal(entry) {
    detailContent.innerHTML = "";
    const img = document.createElement("img");
    img.src = entry.gameImageData;
    img.alt = entry.gameName;
    detailContent.appendChild(img);
    const desc = document.createElement("p");
    desc.textContent = entry.gameDescription;
    detailContent.appendChild(desc);
    playButton.href = entry.shareUrl;
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
});
