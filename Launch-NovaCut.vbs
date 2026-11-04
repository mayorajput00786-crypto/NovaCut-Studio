' NovaCut Studio Silent Desktop Launcher
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strCurDir = fso.GetParentFolderName(WScript.ScriptFullName)

If fso.FileExists(strCurDir & "\NovaCut-Studio-Desktop.exe") Then
    WshShell.Run """" & strCurDir & "\NovaCut-Studio-Desktop.exe""", 1, False
ElseIf fso.FileExists(strCurDir & "\NovaCut-Studio-Desktop-Setup-v2.exe") Then
    WshShell.Run """" & strCurDir & "\NovaCut-Studio-Desktop-Setup-v2.exe""", 1, False
ElseIf fso.FileExists(strCurDir & "\dist-win\NovaCut-Studio-Desktop.exe") Then
    WshShell.Run """" & strCurDir & "\dist-win\NovaCut-Studio-Desktop.exe""", 1, False
Else
    WshShell.Run "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & strCurDir & "\Start-Offline-Server.ps1""", 0, False
End If
