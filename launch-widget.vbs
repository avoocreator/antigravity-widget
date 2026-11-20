' Jalankan widget tanpa jendela terminal. Path otomatis mengikuti lokasi file ini.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
exe = dir & "\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  MsgBox "Electron belum terpasang. Jalankan 'npm install' lalu 'npm run build' di folder ini.", 48, "Antigravity Widget"
  WScript.Quit 1
End If
distHtml = dir & "\dist\index.html"
If Not fso.FileExists(distHtml) Then
  MsgBox "Folder dist belum ada atau belum di-build. Jalankan 'npm run build' dulu ya.", 48, "Antigravity Widget"
  WScript.Quit 1
End If
sh.Run """" & exe & """ """ & dir & """", 0, False
