; Custom assisted-installer additions (hooked in by electron-builder via nsis.include).
; This file must stay UTF-8 WITH BOM — Unicode NSIS mis-decodes the Cyrillic strings otherwise.

!include "nsDialogs.nsh"

; The script is compiled twice (installer + uninstaller). The checkbox page only exists in the
; installer pass — declaring the vars unconditionally trips NSIS warning 6001 ("never set") in
; the uninstaller pass, and electron-builder treats warnings as errors.
!ifndef BUILD_UNINSTALLER
  Var desktopShortcutCheckbox
  Var desktopShortcutState
!endif

!macro customPageAfterChangeDir
  Page custom desktopShortcutPageCreate desktopShortcutPageLeave

  Function desktopShortcutPageCreate
    !insertmacro MUI_HEADER_TEXT "Дополнительные задачи" "Выберите дополнительные задачи установки"
    nsDialogs::Create 1018
    Pop $0
    ${NSD_CreateCheckbox} 0 20u 100% 12u "Создать ярлык на рабочем столе"
    Pop $desktopShortcutCheckbox
    ${NSD_SetState} $desktopShortcutCheckbox ${BST_CHECKED}
    nsDialogs::Show
  FunctionEnd

  Function desktopShortcutPageLeave
    ${NSD_GetState} $desktopShortcutCheckbox $desktopShortcutState
  FunctionEnd
!macroend

!macro customInstall
  ; Runs at the end of the install section, when $INSTDIR is final. During a silent install
  ; the checkbox page never shows and the state stays empty — the shortcut is deliberately
  ; not recreated then, so one deleted by the user doesn't come back on auto-update.
  ${if} $desktopShortcutState == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "${APP_DESCRIPTION}"
    WinShell::SetLnkAUMI "$DESKTOP\${SHORTCUT_NAME}.lnk" "${APP_ID}"
  ${endif}
!macroend

!macro customUnInstall
  ; createDesktopShortcut=false compiles the stock desktop-shortcut cleanup out of the
  ; uninstaller, so the shortcut created in customInstall has to be removed here instead.
  Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
!macroend
