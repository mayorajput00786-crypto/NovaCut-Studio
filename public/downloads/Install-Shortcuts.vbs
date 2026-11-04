' Create Desktop and Start Menu Shortcuts
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strCurDir = fso.GetParentFolderName(WScript.ScriptFullName)
strDesktop = WshShell.SpecialFolders("Desktop")

' Desktop Shortcut
Set oLink = WshShell.CreateShortcut(strDesktop & "\NovaCut Studio.lnk")
If fso.FileExists(strCurDir & "\NovaCut-Studio-Desktop.exe") Then
    oLink.TargetPath = strCurDir & "\NovaCut-Studio-Desktop.exe"
Else
    oLink.TargetPath = "wscript.exe"
    oLink.Arguments = """" & strCurDir & "\Launch-NovaCut.vbs"""
End If
oLink.WorkingDirectory = strCurDir
oLink.Description = "NovaCut AI Video Studio - Professional Video Suite"
oLink.WindowStyle = 1
oLink.Save
