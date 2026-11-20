Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\kira\Projects\antigravity-widget"
WshShell.Run "npm start", 0, False
