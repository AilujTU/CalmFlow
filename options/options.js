// Get all needed HTML Elements
// User Input
const startInput = document.getElementById("startTime");
const endInput = document.getElementById("endTime");
const nrOfTaskInput = document.getElementById("nrOfTaskForReward");
const nrOfMinsInput = document.getElementById("nrOfMinsForReward");
const siteInput = document.getElementById("siteInput");
const taskInput = document.getElementById("taskInput");

// Buttons
const saveScheduleButton = document.getElementById("saveScheduleBtn");
const saveRewardsButton = document.getElementById("saveRewardsBtn");
const addSiteButton = document.getElementById("addSiteBtn");
const addTaskButton = document.getElementById("addTaskBtn");
const clearPrevSiteButton = document.getElementById("clearPrevSiteBtn");
const clearPrevTaskButton = document.getElementById("clearPrevTaskBtn");

// Checkboxes
const weekendsEnabledCheckbox = document.getElementById("weekendsEnabled");
const rewardsEnabledCheckbox = document.getElementById("rewardsEnabled");

// Lists
const currentSiteList = document.getElementById("currentSiteList");
const prevSiteList = document.getElementById("prevSiteList");
const currentTaskList = document.getElementById("currentTaskList");
const prevTaskList = document.getElementById("prevTaskList");

// init empty list sets
let currentSites = [];
let prevSites = [];
let currentTasks = [];
let prevTasks = [];


/**
 * Simplifies the website url given by the user.
 * @param value website url
 * @returns normalized hostname if succesful, otherwise null
 */

function normalizeSite(value) {
  try {

    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = "https://" + value;
    }

    const url = new URL(value);
    let hostname = url.hostname.toLowerCase();


    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * Loads the list of current & previous blocked sites and current & previous tasks.
 */
function loadLists() {
  chrome.storage.sync.get(["currentSites"], (result) => {
    currentSites = result.currentSites || [];
    renderAll();
  });
  chrome.storage.sync.get(["prevSites"], (result) => {
    prevSites = result.prevSites || [];
    renderAll();
  });
  chrome.storage.sync.get(["currentTasks"], (result) => {
    currentTasks = result.currentTasks || [];
    renderAll();
  });
  chrome.storage.sync.get(["prevTasks"], (result) => {
    prevTasks = result.prevTasks || [];
    renderAll();
  });
}

/**
 * Saves blocked current & previous blocked sites and current & previous tasks to storage.
 */
function saveLists() {
  chrome.storage.sync.set({ currentSites: currentSites });
  chrome.storage.sync.set({ prevSites: prevSites });
  chrome.storage.sync.set({ currentTasks: currentTasks });
  chrome.storage.sync.set({ prevTasks: prevTasks });
}

/**
 * Renders list of current & previously blocked websites and current & previously tasks.
 * Includes the normalized web url, a remove button and the favicon of each web url, if possible for the sites.
 * Includes a checkbox and a remove button or a add button for each task.
 */
function renderAll() {
  renderCurrentSites();
  renderPreviousSites();
  renderCurrentTasks();
  renderPreviousTasks();
}

/**
 * Renders the current blocked sites list, 
 * including the normalized web url, a remove button and the favicon of each web url, if possible.
 */
function renderCurrentSites() {
  currentSiteList.innerHTML = "";

  currentSites.forEach((site, index) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${site}`;
    img.width = 16;
    img.height = 16;

    const span = document.createElement("span");
    span.textContent = site;

    left.appendChild(img);
    left.appendChild(span);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.className = "remove";

    removeButton.onclick = () => {
      const removedSite = currentSites[index];

      if (removedSite && !prevSites.includes(removedSite)) prevSites.push(removedSite);

      currentSites.splice(index, 1);
      saveLists();
      renderAll();
    };

    li.appendChild(left);
    li.appendChild(removeButton);
    currentSiteList.appendChild(li);
  });
}

/**
 * Renders the previous blocked sites list, 
 * including the normalized web url, a remove button and the favicon of each web url, if possible.
 */
function renderPreviousSites() {
  prevSiteList.innerHTML = "";

  prevSites.forEach((site, index) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${site}`;
    img.width = 16;
    img.height = 16;

    const span = document.createElement("span");
    span.textContent = site;

    left.appendChild(img);
    left.appendChild(span);

    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.className = "add";

    addButton.onclick = () => {
      const restoredSite = prevSites[index];

      if (restoredSite && !currentSites.includes(restoredSite)) currentSites.push(restoredSite);

      prevSites.splice(index, 1);
      saveLists();
      renderAll();
    }

    li.appendChild(left);
    li.appendChild(addButton);
    prevSiteList.appendChild(li);
  })
}

/**
 * Renders the current tasks list, including a checkbox and the task text.
 */
function renderCurrentTasks() {
  currentTaskList.innerHTML = "";

  currentTasks.forEach((task, index) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";

    const span = document.createElement("span");
    span.textContent = task;

    left.appendChild(checkbox);
    left.appendChild(span);

    checkbox.addEventListener("change", () => {
      const completedTask = currentTasks[index];

      if (completedTask && !prevTasks.includes(completedTask)) {
        prevTasks.push(completedTask);
      }

      currentTasks.splice(index, 1);

      saveLists();
      renderAll();
    });

    li.appendChild(left);
    currentTaskList.appendChild(li);
  })
}

/**
 * Renders the previous/completed task list, including a checked checkbox and the crossed out task text.
 */
function renderPreviousTasks() {
  prevTaskList.innerHTML = "";

  prevTasks.forEach((task, index) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = true;

    const span = document.createElement("span");
    span.textContent = task;
    span.style.textDecoration = "line-through";
    span.style.opacity = "0.5";
    span.style.color = "#6b7280";

    left.appendChild(checkbox);
    left.appendChild(span);

    checkbox.addEventListener("change", () => {
      const restoredTask = prevTasks[index];

      if (restoredTask && !currentTasks.includes(restoredTask)) {
        currentTasks.push(restoredTask);
      }

      prevTasks.splice(index, 1);

      saveLists();
      renderAll();
    });

    li.appendChild(left);
    prevTaskList.appendChild(li);
  })
}

/**
 * Event listener for the add button for sites.
 * Adds added sites to current blocked site list and re-renders it accordingly.
 */
addSiteButton.addEventListener("click", () => {
  const rawValue = siteInput.value.trim();
  const normalized = normalizeSite(rawValue);

  if (!normalized) {
    alert("Invalid website");
    return;
  }

  if (!currentSites.includes(normalized)) {
    currentSites.push(normalized);
    siteInput.value = "";
    saveLists();
    renderAll();
  }
});

/**
 * Input confirmation through enter instead of add button for sites.
 */
siteInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addSiteButton.click();
});

/**
 * Event listener for the add button for tasks.
 * Adds added tasks to current task list and re-renders it accordingly.
 */
addTaskButton.addEventListener("click", () => {
  const value = taskInput.value.trim();

  if (!currentTasks.includes(value)) {
    currentTasks.push(value);
    taskInput.value = "";
    saveLists();
    renderAll();
  }
})

/**
 * Input confirmation through enter instead of add button for tasks.
 */
taskInput.addEventListener("keypress", (e) => {
  if (e.key == "Enter") addTaskButton.click();
})

// Init
loadLists();

/**
 * Event listener for the weekend schedule checkbox.
 * Saves whether weekends are included or excluded from schedule to storage.
 */
weekendsEnabledCheckbox.addEventListener("change", () => {
  chrome.storage.sync.set({ weekendsEnabled: weekendsEnabledCheckbox.checked });
});

/**
 * Event listener for the task rewards checkbox.
 * Saves whether rewards for tasks done are enabled or not to storage.
 */
rewardsEnabledCheckbox.addEventListener("change", () => {
  chrome.storage.sync.set({ rewardsEnabled: rewardsEnabledCheckbox.checked });
})

/**
 * Loads the schedule for when websites should be blocked from storage,
 * including decision of whether weekends are included.
 * Also loads whether rewards are enabled or not, and if how many and how much time each give.
 * Defaults to start 9am and end 5pm.
 */
function loadSchedule() {
  chrome.storage.sync.get(["focusSchedule"], (result) => {
    const schedule = result.focusSchedule || { start: "09:00", end: "17:00" };
    startInput.value = schedule.start;
    endInput.value = schedule.end;
  });
  chrome.storage.sync.get(["weekendsEnabled"], (result) => {
    weekendsEnabledCheckbox.checked = result.weekendsEnabled || false;
  });
  chrome.storage.sync.get(["rewardsEnabled"], (result) => {
    rewardsEnabledCheckbox.checked = result.rewardsEnabled || false;
  });
  chrome.storage.sync.get(["rewardsRules"], (result) => {
    const rules = result.rewardsRules || {amount: 1, mins: 5};
    nrOfTaskInput.value = rules.amount;
    nrOfMinsInput.value = rules.mins;
  });
}

/**
 * Event listener for save schedule button.
 * Saves selected schedule to storage and gives user visual feedback of success.
 */
saveScheduleButton.addEventListener("click", () => {
  const schedule = { start: startInput.value, end: endInput.value };
  chrome.storage.sync.set({ focusSchedule: schedule });
  chrome.storage.sync.set({ weekendsEnabled: weekendsEnabledCheckbox.checked });

  const tmp = saveScheduleButton.textContent;
  saveScheduleButton.textContent = "Saved successfully!";
  setTimeout(() => {
    saveScheduleButton.textContent = tmp;
  }, 3000);
});

/**
 * Event listener for save rewards button.
 * Saves selected rewards rules to storage and gives user visual feedback of success.
 */
saveRewardsButton.addEventListener("click", () => {
  const rules = {amount: nrOfTaskInput.value, mins: nrOfMinsInput.value};
  chrome.storage.sync.set({rewardsRules: rules});
  chrome.storage.sync.set({rewardsEnabled: rewardsEnabledCheckbox.checked});

  const tmp = saveRewardsButton.textContent;
  saveRewardsButton.textContent = "Saved successfully!";
  setTimeout(() => {
    saveRewardsButton.textContent = tmp;
  },3000);
})

/**
 * Event listener for clearing prev sites button.
 * Clears the previously added sites and gives user visual feedback of success.
 */
clearPrevSiteButton.addEventListener("click", () => {
  const successMsg = prevSites.length == 0 ? "Nothing to clear!" : "Cleared successfully!";
  prevSites = [];

  saveLists();
  renderAll();

  const tmp = clearPrevSiteButton.textContent;
  clearPrevSiteButton.textContent = successMsg;
  setTimeout(() => {
    clearPrevSiteButton.textContent = tmp;
  }, 3000);
});

/**
 * Event listener for clearing prev sites button.
 * Clears the previously added sites and gives user visual feedback of success.
 */
clearPrevTaskButton.addEventListener("click", () => {
  const successMsg = prevTasks.length == 0 ? "Nothing to clear!" : "Cleared successfully!";
  prevTasks = [];

  saveLists();
  renderAll();

  const tmp = clearPrevTaskButton.textContent;
  clearPrevTaskButton.textContent = successMsg;
  setTimeout(() => {
    clearPrevTaskButton.textContent = tmp;
  }, 3000);
});

// Initialize schedule
loadSchedule();