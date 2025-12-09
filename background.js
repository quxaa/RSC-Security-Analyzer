// background.js - 负责管理图标状态

// Use browser API for Firefox compatibility (chrome API also works but browser is preferred)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Manifest V3 uses action, V2 uses browserAction - support both for compatibility
const actionAPI = browserAPI.action || browserAPI.browserAction;

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 接收到 content.js 发来的报警信号
    if (request.action === "update_badge" && sender.tab) {
        // 设置红色背景
        actionAPI.setBadgeBackgroundColor({
            tabId: sender.tab.id,
            color: "#FF0000"
        });
        // 设置文本为 "!"
        actionAPI.setBadgeText({
            tabId: sender.tab.id,
            text: "!"
        });
    }
});
