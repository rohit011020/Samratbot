const login = require("ws3-fca");
const fs = require("fs");
const express = require("express");

// === Load AppState ===
let appState;
try {
  appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));
  console.log("✅ AppState loaded successfully.");
} catch (err) {
  console.error("❌ Error reading appstate.json:", err);
  process.exit(1);
}

// === Config ===
const GROUP_THREAD_ID = "24196335160017473";
const LOCKED_GROUP_NAME = "🤪 EXIT FUNNY KIDX + TUSHAR BOKA CHUDKE DAFAN 😂";
const CHECK_INTERVAL = 5000; // every 5s

// === Express Server ===
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("🤖 Group Name Locker Bot is alive!"));
app.listen(PORT, () =>
  console.log(`🌐 Server running on port ${PORT}`)
);

// === Locking Function ===
async function startGroupNameLocker(api) {
  console.log("🚀 Group name locker started...");

  const lockLoop = async () => {
    try {
      const info = await new Promise((resolve, reject) => {
        api.getThreadInfo(GROUP_THREAD_ID, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      if (!info) return console.warn("⚠️ Failed to get group info.");

      if (info.name !== LOCKED_GROUP_NAME) {
        console.warn(`⚠️ Group name changed to: "${info.name}"`);
        console.log("⏳ Resetting name in 10 seconds...");

        setTimeout(() => {
          api.setTitle(LOCKED_GROUP_NAME, GROUP_THREAD_ID, (err) => {
            if (err) {
              console.error("❌ Failed to reset group name:", err);
            } else {
              console.log("🔒 Group name reset successfully ✅");
            }
          });
        }, 10000);
      } else {
        console.log("✅ Group name is correct.");
      }
    } catch (err) {
      console.error("❌ Error during name check:", err.message || err);
    } finally {
      // Random delay (4-7s) to avoid rate limit
      const delay = CHECK_INTERVAL + Math.floor(Math.random() * 2000);
      setTimeout(lockLoop, delay);
    }
  };

  lockLoop(); // start the first loop
}

// === Facebook Login ===
function startBot() {
  login({ appState }, (err, api) => {
    if (err) {
      console.error("❌ Login failed:", err.error || err);
      return setTimeout(startBot, 60000); // retry after 60s
    }

    api.setOptions({ listenEvents: true });
    console.log("✅ Logged in successfully!");
    startGroupNameLocker(api);

    // keep connection alive
    api.listenMqtt((err) => {
      if (err) {
        console.error("⚠️ Connection lost:", err.message);
        console.log("🔄 Reconnecting in 30 seconds...");
        setTimeout(startBot, 30000);
      }
    });
  });
}

startBot();
