Unicode true
!include "MUI2.nsh"

Name "shuati"
OutFile "shuati_setup.exe"
InstallDir "$PROGRAMFILES64\shuati"
RequestExecutionLevel user
SetCompressor lzma

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath $INSTDIR
  File "..\src-tauri\target\release\shuati.exe"
  File "..\src-tauri\target\release\app_lib.dll"
  File "..\src-tauri\target\release\WebView2Loader.dll"
  File "..\导入格式规范.md"

  CreateDirectory "$SMPROGRAMS\shuati"
  CreateShortCut "$SMPROGRAMS\shuati\shuati.lnk" "$INSTDIR\shuati.exe"
  CreateShortCut "$DESKTOP\shuati.lnk" "$INSTDIR\shuati.exe"

  WriteUninstaller "$INSTDIR\uninst.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "DisplayName" "shuati"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "UninstallString" "$\"$INSTDIR\uninst.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "Publisher" "shuati"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\shuati.exe"
  Delete "$INSTDIR\app_lib.dll"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\导入格式规范.md"
  Delete "$INSTDIR\uninst.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\shuati\shuati.lnk"
  Delete "$SMPROGRAMS\shuati\Uninstall.lnk"
  RMDir "$SMPROGRAMS\shuati"

  Delete "$DESKTOP\shuati.lnk"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\shuati"
SectionEnd
