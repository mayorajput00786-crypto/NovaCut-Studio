#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <shellapi.h>
#include <shlobj.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Embedded assets from embedded_assets.o
extern const unsigned char g_embedded_html[];
extern const size_t g_embedded_html_size;
extern const unsigned char g_embedded_js[];
extern const size_t g_embedded_js_size;
extern const unsigned char g_embedded_css[];
extern const size_t g_embedded_css_size;
extern const char* g_embedded_js_name;
extern const char* g_embedded_css_name;

static char g_distDir[MAX_PATH] = {0};
static int g_serverPort = 0;
static volatile BOOL g_running = TRUE;

// JSON Mock responses for fully self-contained offline master owner experience
static const char g_json_auth_session[] = 
    "{\"authenticated\":true,\"isOwner\":true,\"user\":{\"email\":\"mayorajput00786@gmail.com\",\"displayName\":\"Master Lifetime Owner\",\"isOwner\":true,\"plan\":\"Master Lifetime Owner\",\"permissions\":[\"all\",\"admin\",\"export\",\"bulk\",\"ai\",\"no_watermark\"]}}";

static const char g_json_admin_metrics[] = 
    "{\"success\":true,\"totalLicenses\":100,\"activeLicenses\":88,\"activeDevices\":120,\"systemStatus\":\"Operational (Local High-Performance Engine)\"}";

static const char g_json_admin_owners[] = 
    "{\"success\":true,\"owners\":[{\"email\":\"mayorajput00786@gmail.com\",\"role\":\"Master Owner\",\"status\":\"active\"},{\"email\":\"josnking01@gmail.com\",\"role\":\"Master Owner\",\"status\":\"active\"}]}";

static const char g_json_license_validate[] = 
    "{\"valid\":true,\"plan\":\"Master Lifetime Owner\",\"isOwner\":true,\"status\":\"active\"}";

static const char g_json_generic_ok[] = 
    "{\"success\":true,\"status\":\"ok\"}";

// Send HTTP Response helper
static void SendHttpResponse(SOCKET sock, int statusCode, const char* statusText, const char* contentType, const unsigned char* body, size_t bodyLen) {
    char header[512];
    int hLen = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %lu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Cache-Control: no-cache\r\n"
        "Connection: close\r\n\r\n",
        statusCode, statusText, contentType, (unsigned long)bodyLen);

    send(sock, header, hLen, 0);
    if (body && bodyLen > 0) {
        size_t totalSent = 0;
        while (totalSent < bodyLen) {
            size_t toSend = bodyLen - totalSent;
            if (toSend > 16384) toSend = 16384;
            int sent = send(sock, (const char*)(body + totalSent), (int)toSend, 0);
            if (sent <= 0) break;
            totalSent += (size_t)sent;
        }
    }
}

// Get MIME type by file extension
static const char* GetMimeType(const char* path) {
    const char* ext = strrchr(path, '.');
    if (!ext) return "text/html; charset=utf-8";
    if (_stricmp(ext, ".html") == 0) return "text/html; charset=utf-8";
    if (_stricmp(ext, ".js") == 0)   return "application/javascript; charset=utf-8";
    if (_stricmp(ext, ".mjs") == 0)  return "application/javascript; charset=utf-8";
    if (_stricmp(ext, ".css") == 0)  return "text/css; charset=utf-8";
    if (_stricmp(ext, ".json") == 0) return "application/json; charset=utf-8";
    if (_stricmp(ext, ".png") == 0)  return "image/png";
    if (_stricmp(ext, ".jpg") == 0 || _stricmp(ext, ".jpeg") == 0) return "image/jpeg";
    if (_stricmp(ext, ".svg") == 0)  return "image/svg+xml";
    if (_stricmp(ext, ".ico") == 0)  return "image/x-icon";
    if (_stricmp(ext, ".mp4") == 0)  return "video/mp4";
    if (_stricmp(ext, ".mp3") == 0)  return "audio/mpeg";
    if (_stricmp(ext, ".wav") == 0)  return "audio/wav";
    if (_stricmp(ext, ".woff2") == 0) return "font/woff2";
    if (_stricmp(ext, ".woff") == 0)  return "font/woff";
    if (_stricmp(ext, ".ttf") == 0)   return "font/ttf";
    return "application/octet-stream";
}

// Serve single client request
static void HandleClient(SOCKET clientSock) {
    char buffer[4096];
    int bytesRecv = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
    if (bytesRecv <= 0) {
        closesocket(clientSock);
        return;
    }
    buffer[bytesRecv] = '\0';

    char method[16] = {0};
    char rawUri[1024] = {0};
    sscanf(buffer, "%15s %1023s", method, rawUri);

    // Strip query string
    char* q = strchr(rawUri, '?');
    if (q) *q = '\0';

    // OPTIONS preflight
    if (_stricmp(method, "OPTIONS") == 0) {
        SendHttpResponse(clientSock, 204, "No Content", "text/plain", NULL, 0);
        closesocket(clientSock);
        return;
    }

    // 1. Handle API Endpoints for Offline Operation
    if (strncmp(rawUri, "/api/", 5) == 0) {
        if (strstr(rawUri, "/auth/session") || strstr(rawUri, "/auth/google/verify") || strstr(rawUri, "/auth/login")) {
            SendHttpResponse(clientSock, 200, "OK", "application/json; charset=utf-8", 
                             (const unsigned char*)g_json_auth_session, strlen(g_json_auth_session));
        } else if (strstr(rawUri, "/admin/metrics")) {
            SendHttpResponse(clientSock, 200, "OK", "application/json; charset=utf-8", 
                             (const unsigned char*)g_json_admin_metrics, strlen(g_json_admin_metrics));
        } else if (strstr(rawUri, "/admin/owners")) {
            SendHttpResponse(clientSock, 200, "OK", "application/json; charset=utf-8", 
                             (const unsigned char*)g_json_admin_owners, strlen(g_json_admin_owners));
        } else if (strstr(rawUri, "/license/validate") || strstr(rawUri, "/license/activate")) {
            SendHttpResponse(clientSock, 200, "OK", "application/json; charset=utf-8", 
                             (const unsigned char*)g_json_license_validate, strlen(g_json_license_validate));
        } else {
            SendHttpResponse(clientSock, 200, "OK", "application/json; charset=utf-8", 
                             (const unsigned char*)g_json_generic_ok, strlen(g_json_generic_ok));
        }
        closesocket(clientSock);
        return;
    }

    // 2. Check if this is the embedded JavaScript bundle
    if (strstr(rawUri, ".js") != NULL) {
        SendHttpResponse(clientSock, 200, "OK", "application/javascript; charset=utf-8",
                         g_embedded_js, g_embedded_js_size);
        closesocket(clientSock);
        return;
    }

    // 3. Check if this is the embedded CSS bundle
    if (strstr(rawUri, ".css") != NULL) {
        SendHttpResponse(clientSock, 200, "OK", "text/css; charset=utf-8",
                         g_embedded_css, g_embedded_css_size);
        closesocket(clientSock);
        return;
    }

    // 4. Try loading from local disk if file exists (e.g. images, audio, downloads)
    if (g_distDir[0] != '\0') {
        char localFilePath[MAX_PATH * 2];
        const char* reqPath = (strcmp(rawUri, "/") == 0) ? "/index.html" : rawUri;
        snprintf(localFilePath, sizeof(localFilePath), "%s%s", g_distDir, reqPath);
        for (char* p = localFilePath; *p; p++) {
            if (*p == '/') *p = '\\';
        }

        DWORD attr = GetFileAttributesA(localFilePath);
        if (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY)) {
            FILE* f = fopen(localFilePath, "rb");
            if (f) {
                fseek(f, 0, SEEK_END);
                long fileSize = ftell(f);
                fseek(f, 0, SEEK_SET);

                const char* mime = GetMimeType(localFilePath);
                char header[512];
                int hLen = snprintf(header, sizeof(header),
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: %s\r\n"
                    "Content-Length: %ld\r\n"
                    "Access-Control-Allow-Origin: *\r\n"
                    "Connection: close\r\n\r\n",
                    mime, fileSize);
                send(clientSock, header, hLen, 0);

                char sendBuf[16384];
                size_t nRead;
                while ((nRead = fread(sendBuf, 1, sizeof(sendBuf), f)) > 0) {
                    send(clientSock, sendBuf, (int)nRead, 0);
                }
                fclose(f);
                closesocket(clientSock);
                return;
            }
        }
    }

    // 5. Default SPA Fallback: ALWAYS return embedded index.html with 200 OK
    // (Never return 404 to avoid broken user experience)
    SendHttpResponse(clientSock, 200, "OK", "text/html; charset=utf-8",
                     g_embedded_html, g_embedded_html_size);
    closesocket(clientSock);
}

// Background HTTP Server thread
static DWORD WINAPI HttpServerThread(LPVOID lpParam) {
    SOCKET listenSock = (SOCKET)(uintptr_t)lpParam;
    while (g_running) {
        struct sockaddr_in clientAddr;
        int clientLen = sizeof(clientAddr);
        SOCKET clientSock = accept(listenSock, (struct sockaddr*)&clientAddr, &clientLen);
        if (clientSock == INVALID_SOCKET) {
            break;
        }
        HandleClient(clientSock);
    }
    return 0;
}

// Helper to create or overwrite Windows Desktop shortcut
static void CreateDesktopShortcut(const char* targetPath, const char* arguments, const char* description) {
    char tempPath[MAX_PATH];
    GetTempPathA(MAX_PATH, tempPath);
    
    char vbsFile[MAX_PATH];
    snprintf(vbsFile, MAX_PATH, "%snovacut_shortcut.vbs", tempPath);
    
    FILE* f = fopen(vbsFile, "w");
    if (f) {
        fprintf(f, "On Error Resume Next\r\n");
        fprintf(f, "Set WshShell = CreateObject(\"WScript.Shell\")\r\n");
        fprintf(f, "Set fso = CreateObject(\"Scripting.FileSystemObject\")\r\n");
        fprintf(f, "strDesktop = WshShell.SpecialFolders(\"Desktop\")\r\n");
        fprintf(f, "lnkPath = strDesktop & \"\\\\NovaCut Studio.lnk\"\r\n");
        fprintf(f, "If fso.FileExists(lnkPath) Then fso.DeleteFile lnkPath, True\r\n");
        fprintf(f, "Set oLink = WshShell.CreateShortcut(lnkPath)\r\n");
        fprintf(f, "oLink.TargetPath = \"%s\"\r\n", targetPath);
        if (arguments && strlen(arguments) > 0) {
            fprintf(f, "oLink.Arguments = \"%s\"\r\n", arguments);
        }
        fprintf(f, "oLink.Description = \"%s\"\r\n", description);
        fprintf(f, "oLink.WindowStyle = 1\r\n");
        fprintf(f, "oLink.Save\r\n");
        fclose(f);
        
        ShellExecuteA(NULL, "open", "wscript.exe", vbsFile, NULL, SW_HIDE);
    }
}

// Locate Microsoft Edge or Chrome
static const char* FindBrowser(void) {
    static const char* browsers[] = {
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    };
    for (int i = 0; i < 4; i++) {
        DWORD attr = GetFileAttributesA(browsers[i]);
        if (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY)) {
            return browsers[i];
        }
    }
    return NULL;
}

// Ensure directory hierarchy exists
static void EnsureDirectory(const char* dir) {
    char tmp[MAX_PATH];
    snprintf(tmp, sizeof(tmp), "%s", dir);
    for (char* p = tmp + 3; *p; p++) {
        if (*p == '\\' || *p == '/') {
            char c = *p;
            *p = '\0';
            CreateDirectoryA(tmp, NULL);
            *p = c;
        }
    }
    CreateDirectoryA(tmp, NULL);
}

// Extract embedded files to disk as persistent local cache
static void ExtractEmbeddedFilesToCache(const char* targetDir) {
    EnsureDirectory(targetDir);

    char assetsDir[MAX_PATH];
    snprintf(assetsDir, sizeof(assetsDir), "%s\\assets", targetDir);
    EnsureDirectory(assetsDir);

    // Write index.html
    char pathHtml[MAX_PATH];
    snprintf(pathHtml, sizeof(pathHtml), "%s\\index.html", targetDir);
    FILE* fHtml = fopen(pathHtml, "wb");
    if (fHtml) {
        fwrite(g_embedded_html, 1, g_embedded_html_size, fHtml);
        fclose(fHtml);
    }

    // Write JS
    char pathJs[MAX_PATH];
    snprintf(pathJs, sizeof(pathJs), "%s\\assets\\%s", targetDir, g_embedded_js_name);
    FILE* fJs = fopen(pathJs, "wb");
    if (fJs) {
        fwrite(g_embedded_js, 1, g_embedded_js_size, fJs);
        fclose(fJs);
    }

    // Write CSS
    char pathCss[MAX_PATH];
    snprintf(pathCss, sizeof(pathCss), "%s\\assets\\%s", targetDir, g_embedded_css_name);
    FILE* fCss = fopen(pathCss, "wb");
    if (fCss) {
        fwrite(g_embedded_css, 1, g_embedded_css_size, fCss);
        fclose(fCss);
    }
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    char exeFullPath[MAX_PATH];
    GetModuleFileNameA(NULL, exeFullPath, MAX_PATH);

    char exeDir[MAX_PATH];
    strncpy(exeDir, exeFullPath, MAX_PATH);
    char* lastSlash = strrchr(exeDir, '\\');
    if (lastSlash) {
        *lastSlash = '\0';
    }
    SetCurrentDirectoryA(exeDir);

    // 1. Prepare Local App Directory in %LOCALAPPDATA%\NovaCut-Studio
    char localAppData[MAX_PATH] = {0};
    if (GetEnvironmentVariableA("LOCALAPPDATA", localAppData, MAX_PATH) == 0) {
        GetTempPathA(MAX_PATH, localAppData);
    }
    char appCacheDir[MAX_PATH];
    snprintf(appCacheDir, sizeof(appCacheDir), "%s\\NovaCut-Studio", localAppData);
    ExtractEmbeddedFilesToCache(appCacheDir);

    // Check if user has an adjacent dist folder with custom files
    char adjacentDist[MAX_PATH];
    snprintf(adjacentDist, sizeof(adjacentDist), "%s\\dist\\index.html", exeDir);
    if (GetFileAttributesA(adjacentDist) != INVALID_FILE_ATTRIBUTES) {
        snprintf(g_distDir, sizeof(g_distDir), "%s\\dist", exeDir);
    } else {
        strncpy(g_distDir, appCacheDir, sizeof(g_distDir));
    }

    // 2. Start Embedded High-Performance Winsock HTTP Server
    WSADATA wsa;
    SOCKET listenSock = INVALID_SOCKET;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) == 0) {
        listenSock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (listenSock != INVALID_SOCKET) {
            struct sockaddr_in servAddr;
            memset(&servAddr, 0, sizeof(servAddr));
            servAddr.sin_family = AF_INET;
            servAddr.sin_addr.s_addr = inet_addr("127.0.0.1");

            // First try standard port 3000, if busy let OS assign free port
            servAddr.sin_port = htons(3000);
            if (bind(listenSock, (struct sockaddr*)&servAddr, sizeof(servAddr)) != 0) {
                servAddr.sin_port = htons(0); // Any available port
                bind(listenSock, (struct sockaddr*)&servAddr, sizeof(servAddr));
            }

            if (listen(listenSock, 64) == 0) {
                struct sockaddr_in boundAddr;
                int boundLen = sizeof(boundAddr);
                getsockname(listenSock, (struct sockaddr*)&boundAddr, &boundLen);
                g_serverPort = ntohs(boundAddr.sin_port);

                CreateThread(NULL, 0, HttpServerThread, (LPVOID)(uintptr_t)listenSock, 0, NULL);
            }
        }
    }

    char appUrl[512];
    if (g_serverPort > 0) {
        snprintf(appUrl, sizeof(appUrl), "http://127.0.0.1:%d/", g_serverPort);
    } else {
        // Fallback to local file cache directly
        snprintf(appUrl, sizeof(appUrl), "file:///%s\\index.html", appCacheDir);
    }

    // 3. Create Windows Desktop Shortcut pointing directly to this EXE
    CreateDesktopShortcut(exeFullPath, "", "NovaCut AI Video Studio - Professional Video Suite");

    // 4. Launch Desktop Window Mode via Microsoft Edge or Chrome
    const char* browser = FindBrowser();
    char appArgs[1024];
    snprintf(appArgs, sizeof(appArgs), "--app=%s --window-size=1440,900", appUrl);

    HANDLE hProcess = NULL;
    if (browser) {
        STARTUPINFOA si;
        PROCESS_INFORMATION pi;
        memset(&si, 0, sizeof(si));
        si.cb = sizeof(si);
        memset(&pi, 0, sizeof(pi));

        char cmdLine[2048];
        snprintf(cmdLine, sizeof(cmdLine), "\"%s\" %s", browser, appArgs);

        if (CreateProcessA(NULL, cmdLine, NULL, NULL, FALSE, 0, NULL, exeDir, &si, &pi)) {
            hProcess = pi.hProcess;
            CloseHandle(pi.hThread);
        } else {
            ShellExecuteA(NULL, "open", browser, appArgs, NULL, SW_SHOWNORMAL);
        }
    } else {
        ShellExecuteA(NULL, "open", appUrl, NULL, NULL, SW_SHOWNORMAL);
    }

    // 5. Keep HTTP server active while browser window is open
    if (listenSock != INVALID_SOCKET) {
        if (hProcess != NULL) {
            WaitForSingleObject(hProcess, INFINITE);
            CloseHandle(hProcess);
        } else {
            // Keep alive for 8 hours or until process terminate
            for (int i = 0; i < 14400 && g_running; i++) {
                Sleep(2000);
            }
        }
        g_running = FALSE;
        closesocket(listenSock);
        WSACleanup();
    }

    return 0;
}
