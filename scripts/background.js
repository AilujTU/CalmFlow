
async function getCurrentSites() {
  const result = await chrome.storage.sync.get(["currentSites"]);
  return result.currentSites || [];
}

async function getBreakBalance() {
  const result = await chrome.storage.sync.get(["breakBalance"]);
  return result.breakBalanceMs || 0;
}

async function setBreakBalance(value) {
  await chrome.storage.sync.set({breakBalanceMs: value});
}

async function getBreakUntil() {
  const result = await chrome.storage.sync.get(["breakUntil"]);
  return result.breakUntil || 0;
}

async function setBreakUntil(value) {
  await chrome.storage.sync.set({onBreak: value});
}

async function startBreak() {
  const balance = await getBreakBalance();
  
  if (balance <= 0)
    return;

  const breakUntil = Date.now() + balance;

  await setBreakUntil(breakUntil);

  await setBreakBalance(0);
}

async function isOnBreak() {
  const breakUntil = await getBreakUntil();

  return Date.now() < breakUntil;
}

/**
 * Checks if current time is within the blocked schedule.
 * If yes, the callback function is called with true.
 * If not, the callback function is called with false.
 * The schedule is assumed to span over midnight, 
 * if end time is samller than start time.
 * @param callback decides wether or not to display focus overlay for given website
 */
function isWithinSchedule(callback) {
  chrome.storage.sync.get(["focusSchedule"], (result) => {
    const schedule = result.focusSchedule || { start: "09:00", end: "17:00" };
    const now = new Date();
    const [startHour, startMin] = schedule.start.split(":").map(Number);
    const [endHour, endMin] = schedule.end.split(":").map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    if (endTime < startTime) {
      if (now >= startTime || now <= endTime) callback(true);
      else callback(false);
    } else {
      callback(now >= startTime && now <= endTime);
    }
  });
}
/**
 * Checks first if the schedule is not enabled for weekends and then if it's the weekend.
 * If yes, the callback function is called with true.
 * If not, the callback function is called with false.
 * @param callback decides the behaviour if schedule is enabled and it's the weekend
 */
function isNotEnabledAndWeekend(callback) {
  chrome.storage.sync.get(["weekendsEnabled"], (result) => {
    const day = new Date().getDay();
    const isEnabled = result.weekendsEnabled || false;

    if (!isEnabled && (day == 0 || day == 6)) callback(true);
    else callback(false);
  });
}

/**
 * Injects focus overlay if called, blocking the website from access.
 * @param tabId defines the target of the script
 */
function injectOverlay(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (document.getElementById("focus-block-overlay")) return;

      const overlay = document.createElement("div");
      overlay.id = "focus-block-overlay";

      const remainingBreakTimeInMin = Math.floor(await getBreakBalance() / 60000);

      overlay.innerHTML = `
        <div class="focus-box">
          <h1>Nope, not right now.</h1>
          <button id="focus-reward-btn">Take a ${remainingBreakTimeInMin} break?</button>
          <p>This site is blocked to help you stay productive.</p>
          <button id="focus-close-btn">Okay.</button>          
        </div>
      `;

      const style = document.createElement("style");
      style.textContent = `
        #focus-block-overlay {
          position: fixed;
          top:0; left:0; width:100%; height:100%;
          background: #FFFF;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          backdrop-filter: blur(8px);
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          animation: fadeInOverlay 0.3s forwards;
        }
        .focus-box {
          background: #F2EAE0; padding:36px 28px; border-radius:20px;
          max-width:400px; width:90%; min-height:180px;
          box-shadow:0 8px 24px rgba(0,0,0,0.12);
          display:flex; flex-direction:column;
          justify-content:center; align-items:center; gap:18px;
          text-align:center;
        }
        .focus-box h1 { 
          margin:0; 
          font-size:22px; 
          font-weight:600; 
          color:#2c3e50; 
        }
        .focus-box p { 
          margin:0; 
          font-size:15px; 
          color:#4f5b66; 
        }
        #focus-close-btn{ 
          display: flex;
          align-items: center;
          justify-content: center;
          padding:12px 26px; 
          border:none; 
          border-radius:12px;
          background: linear-gradient(135deg, #B4D3D9, #BDA6CE); 
          color:#fff; 
          font-size:15px;
          cursor:pointer; 
          min-width:130px; 
          transition: background 0.3s, transform 0.2s;
        }
        #focus-close-btn:hover{ 
          background: linear-gradient(135deg, #BDA6CE, #9B8EC7); 
          transform:translateY(-2px); 
        }
        #focus-reward-btn{
          display: flex;
          align-items: center;
          justify-content: center;
          padding:12px 26px; 
          border:none; 
          border-radius:12px;
          background: linear-gradient(135deg, #BDA6CE, #B4D3D9); 
          color:#fff; 
          font-size:15px;
          cursor:pointer; 
          min-width:130px; 
          transition: background 0.3s, transform 0.2s;
        }
        #focus-reward-btn:hover{ 
          background: linear-gradient(135deg, #9B8EC7, #BDA6CE); 
          transform:translateY(-2px); 
        }
        @keyframes fadeInOverlay { 
          from{opacity:0;} to{opacity:1;} 
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(overlay);
      document.documentElement.style.overflow = "hidden";

      document.getElementById("focus-close-btn").onclick = () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
      };

      document.getElementById("focus-reward-btn").onclick = () => {
        chrome.runtime.sendMessage({action: "startBreak"});
      };
    }
  });
}

/**
 * Checks on change in tab, first if on break, if not it checks if a blocked website is currently visited.
 * If so, it further checks if it's within the blocked schedule and blocks accordingly.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  if (await isOnBreak()) return;

  const currentSites = await getCurrentSites();

  const url = new URL(tab.url);

  if (!currentSites.some(site => url.hostname.includes(site))) return;

  isWithinSchedule((shouldBlock) => {
    if (!shouldBlock) return;
    isNotEnabledAndWeekend((notEnabledAndWeekend) => {
      if (!notEnabledAndWeekend)
        injectOverlay(tabId);
    });
  });
});


/**
 * Simple runtime listener for closing the tab.
 */
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab?.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});

chrome.runtime.onMessage.addListener(async (message,sender) => {
  if (message.action === "startBreak" && sender.tab?.id) {
    await startBreak();
    chrome.tabs.reload(sender.tab.id);
  }
});