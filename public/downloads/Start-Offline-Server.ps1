# NovaCut Studio PowerShell Local Web Server
$ErrorActionPreference = 'SilentlyContinue'
$Port = 3000
$BaseDir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $BaseDir)) { $BaseDir = $PSScriptRoot }

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $Listener.Start()
} catch {
    $Port = 3001
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add("http://127.0.0.1:$Port/")
    $Listener.Start()
}

$Edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
$Edge32 = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Url = "http://127.0.0.1:$Port/"

if (Test-Path $Edge) {
    Start-Process $Edge -ArgumentList "--app=$Url --window-size=1440,900"
} elseif (Test-Path $Edge32) {
    Start-Process $Edge32 -ArgumentList "--app=$Url --window-size=1440,900"
} elseif (Test-Path $Chrome) {
    Start-Process $Chrome -ArgumentList "--app=$Url --window-size=1440,900"
} else {
    Start-Process $Url
}

while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Request = $Context.Request
    $Response = $Context.Response
    
    $RawUrl = $Request.Url.AbsolutePath
    if ($RawUrl -eq "/" -or [string]::IsNullOrEmpty($RawUrl)) { $RawUrl = "/index.html" }
    
    $FilePath = Join-Path $BaseDir $RawUrl.TrimStart('/')
    if (-not (Test-Path $FilePath) -or (Get-Item $FilePath).PSIsContainer) {
        $FilePath = Join-Path $BaseDir "index.html"
    }
    
    if (Test-Path $FilePath) {
        $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
        $Mime = "text/html; charset=utf-8"
        if ($Ext -eq ".js") { $Mime = "application/javascript; charset=utf-8" }
        elseif ($Ext -eq ".css") { $Mime = "text/css; charset=utf-8" }
        elseif ($Ext -eq ".json") { $Mime = "application/json; charset=utf-8" }
        elseif ($Ext -eq ".png") { $Mime = "image/png" }
        elseif ($Ext -eq ".jpg") { $Mime = "image/jpeg" }
        
        $Response.ContentType = $Mime
        $Response.ContentLength64 = $Bytes.Length
        $Response.AddHeader("Access-Control-Allow-Origin", "*")
        $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    }
    $Response.Close()
}
