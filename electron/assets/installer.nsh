; ════════════════════════════════════════════════════════════════════
;  Wersee Installer v1.2 — fully custom nsDialogs pages + animations
;  Dark-mode Wersee brand, pulsing dots, color-cycling success glyph,
;  permissions & setup page with animated icons. Designed to drop
;  into electron-builder via `nsis.include`.
;
;  Never `!define` MUI_* constants here — electron-builder already
;  manages them and redefining them previously broke Windows builds.
; ════════════════════════════════════════════════════════════════════

!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

; ── Dark-mode for custom pages ───────────────────────────────────────
; electron-builder owns MUI_* defines. Redefining them breaks NSIS builds.
; Force a solid dark background on the custom installer window.
BGGradient 0a0a0a 0a0a0a ffffff

; ── Shared palette ───────────────────────────────────────────────────
!define WERSEE_BG          0x0A0A0A
!define WERSEE_PANEL       0x111111
!define WERSEE_BORDER      0x1F1F1F
!define WERSEE_TEXT        0xFFFFFF
!define WERSEE_MUTED       0x9CA3AF
!define WERSEE_DIM         0x6B7280
!define WERSEE_ACCENT      0x6366F1
!define WERSEE_ACCENT_HOT  0x818CF8
!define WERSEE_ACCENT_SOFT 0xA855F7
!define WERSEE_PINK        0xEC4899
!define WERSEE_SUCCESS     0x10B981
!define WERSEE_SUCCESS_HOT 0x34D399
!define WERSEE_AMBER       0xFBBF24

; ── Dialog / control handles (file-scope for timer callbacks) ───────
; NSIS emits warning 6001 (treated as error) for unreferenced vars.
; Gate installer-only and uninstaller-only vars by build context.

!ifndef BUILD_UNINSTALLER
  Var WERSEE_DIALOG

  ; Welcome page
  Var W_LOGO
  Var W_TITLE
  Var W_SUB
  Var W_DOT1
  Var W_DOT2
  Var W_DOT3
  Var W_BULLET1
  Var W_BULLET2
  Var W_BULLET3
  Var W_FOOTER
  Var W_TICK

  ; Permissions page
  Var P_DIALOG
  Var P_KICKER
  Var P_TITLE
  Var P_SUB
  Var P_ICON1
  Var P_CB1
  Var P_DESC1
  Var P_ICON2
  Var P_CB2
  Var P_DESC2
  Var P_ICON3
  Var P_CB3
  Var P_DESC3
  Var P_ICON4
  Var P_CB4
  Var P_DESC4
  Var P_TICK
  Var P_STATE_DOCS
  Var P_STATE_BG
  Var P_STATE_AUTOSTART
  Var P_STATE_DESKTOP

  ; Finish page
  Var F_CHECK
  Var F_TITLE
  Var F_SUB
  Var F_NOTE
  Var F_SPARKLE1
  Var F_SPARKLE2
  Var F_SPARKLE3
  Var F_RUN_CHECK
  Var F_LINK
  Var F_RUN_STATE
  Var F_TICK

  ; Fonts (installer-side)
  Var FONT_TITLE_XL
  Var FONT_HEADING
  Var FONT_BODY
  Var FONT_SMALL
  Var FONT_CHECK_HUGE
  Var FONT_DOT
  Var FONT_ICON
!endif

!ifdef BUILD_UNINSTALLER
  ; Uninstall welcome
  Var UN_DIALOG
  Var UN_TITLE
  Var UN_SUB
  Var UN_NOTE
!endif

; ════════════════════════════════════════════════════════════════════
;  customHeader
; ════════════════════════════════════════════════════════════════════

!macro customHeader
  ; electron-builder manages MUI constants; we only add our own pages.
!macroend

; ════════════════════════════════════════════════════════════════════
;  CUSTOM PAGES STACK — Welcome, then Permissions
; ════════════════════════════════════════════════════════════════════

!macro customWelcomePage
  Page custom werseeWelcomeShow werseeWelcomeLeave
!macroend

!macro customPageAfterChangeDir
  Page custom werseePermissionsShow werseePermissionsLeave
!macroend

; Installer-only functions must be gated — in uninstaller builds
; electron-builder compiles the same script with BUILD_UNINSTALLER
; defined; unreferenced Functions there trigger warning 6010.

!ifndef BUILD_UNINSTALLER

; ────────────────────────────────────────────────────────────────────
;  WELCOME PAGE — pulsing dots, big title
; ────────────────────────────────────────────────────────────────────

Function werseeWelcomeShow
  nsDialogs::Create 1018
  Pop $WERSEE_DIALOG
  ${If} $WERSEE_DIALOG == error
    Abort
  ${EndIf}

  SetCtlColors $WERSEE_DIALOG ${WERSEE_TEXT} ${WERSEE_BG}

  CreateFont $FONT_TITLE_XL "Segoe UI" 30 800
  CreateFont $FONT_HEADING  "Segoe UI" 13 600
  CreateFont $FONT_BODY     "Segoe UI" 10 400
  CreateFont $FONT_SMALL    "Segoe UI"  8 400
  CreateFont $FONT_DOT      "Segoe UI" 20 800

  ${NSD_CreateLabel} 30u 16u 220u 12u "WERSEE  ◆  DESKTOP APP"
  Pop $W_LOGO
  SendMessage $W_LOGO ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $W_LOGO ${WERSEE_MUTED} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 32u 280u 36u "Welcome to Wersee"
  Pop $W_TITLE
  SendMessage $W_TITLE ${WM_SETFONT} $FONT_TITLE_XL 0
  SetCtlColors $W_TITLE ${WERSEE_TEXT} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 72u 280u 30u "The premium platform for creators & businesses. We're preparing your workspace — this takes less than a minute."
  Pop $W_SUB
  SendMessage $W_SUB ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $W_SUB ${WERSEE_MUTED} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 108u 10u 16u "●"
  Pop $W_DOT1
  SendMessage $W_DOT1 ${WM_SETFONT} $FONT_DOT 0
  SetCtlColors $W_DOT1 ${WERSEE_ACCENT} ${WERSEE_BG}

  ${NSD_CreateLabel} 44u 108u 10u 16u "●"
  Pop $W_DOT2
  SendMessage $W_DOT2 ${WM_SETFONT} $FONT_DOT 0
  SetCtlColors $W_DOT2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}

  ${NSD_CreateLabel} 58u 108u 10u 16u "●"
  Pop $W_DOT3
  SendMessage $W_DOT3 ${WM_SETFONT} $FONT_DOT 0
  SetCtlColors $W_DOT3 ${WERSEE_PINK} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 134u 280u 12u "◆   Native desktop — faster than the browser, tray + shortcuts."
  Pop $W_BULLET1
  SendMessage $W_BULLET1 ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $W_BULLET1 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 148u 280u 12u "◆   Signed & verified — installer & auto-updates by Wersee."
  Pop $W_BULLET2
  SendMessage $W_BULLET2 ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $W_BULLET2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 162u 280u 12u "◆   One-click Google / email login when you launch."
  Pop $W_BULLET3
  SendMessage $W_BULLET3 ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $W_BULLET3 ${WERSEE_PINK} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 188u 280u 12u "Click Next to continue.  By continuing you agree to the Wersee Terms & Privacy Policy."
  Pop $W_FOOTER
  SendMessage $W_FOOTER ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $W_FOOTER ${WERSEE_DIM} ${WERSEE_BG}

  StrCpy $W_TICK 0
  ${NSD_CreateTimer} werseeWelcomeTick 220

  nsDialogs::Show
FunctionEnd

Function werseeWelcomeTick
  IntOp $W_TICK $W_TICK + 1
  IntOp $0 $W_TICK % 4

  ${If} $0 == 0
    SetCtlColors $W_DOT1 ${WERSEE_ACCENT}      ${WERSEE_BG}
    SetCtlColors $W_DOT2 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $W_DOT3 ${WERSEE_DIM}         ${WERSEE_BG}
  ${ElseIf} $0 == 1
    SetCtlColors $W_DOT1 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $W_DOT2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
    SetCtlColors $W_DOT3 ${WERSEE_DIM}         ${WERSEE_BG}
  ${ElseIf} $0 == 2
    SetCtlColors $W_DOT1 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $W_DOT2 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $W_DOT3 ${WERSEE_PINK}        ${WERSEE_BG}
  ${Else}
    SetCtlColors $W_DOT1 ${WERSEE_ACCENT_HOT}  ${WERSEE_BG}
    SetCtlColors $W_DOT2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
    SetCtlColors $W_DOT3 ${WERSEE_PINK}        ${WERSEE_BG}
  ${EndIf}

  System::Call 'user32::InvalidateRect(i $W_DOT1, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $W_DOT2, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $W_DOT3, i 0, i 1)'
FunctionEnd

Function werseeWelcomeLeave
  ${NSD_KillTimer} werseeWelcomeTick
FunctionEnd

; ────────────────────────────────────────────────────────────────────
;  PERMISSIONS PAGE — v1.2 one-time setup consents
; ────────────────────────────────────────────────────────────────────

Function werseePermissionsShow
  nsDialogs::Create 1018
  Pop $P_DIALOG
  ${If} $P_DIALOG == error
    Abort
  ${EndIf}

  SetCtlColors $P_DIALOG ${WERSEE_TEXT} ${WERSEE_BG}

  CreateFont $FONT_TITLE_XL "Segoe UI" 24 800
  CreateFont $FONT_HEADING  "Segoe UI" 11 700
  CreateFont $FONT_BODY     "Segoe UI"  9 400
  CreateFont $FONT_SMALL    "Segoe UI"  8 400
  CreateFont $FONT_ICON     "Segoe UI" 18 700

  ${NSD_CreateLabel} 20u 8u 280u 10u "WERSEE  ◆  TOESTEMMINGEN & INSTALLATIE"
  Pop $P_KICKER
  SendMessage $P_KICKER ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_KICKER ${WERSEE_MUTED} ${WERSEE_BG}

  ${NSD_CreateLabel} 20u 20u 280u 24u "Sta Wersee toe om..."
  Pop $P_TITLE
  SendMessage $P_TITLE ${WM_SETFONT} $FONT_TITLE_XL 0
  SetCtlColors $P_TITLE ${WERSEE_TEXT} ${WERSEE_BG}

  ${NSD_CreateLabel} 20u 46u 280u 10u "Kies welke onderdelen je activeert. Je kunt dit altijd wijzigen in de app-instellingen."
  Pop $P_SUB
  SendMessage $P_SUB ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_SUB ${WERSEE_MUTED} ${WERSEE_BG}

  ; ── 1. Documenten-map ──
  ${NSD_CreateLabel} 20u 66u 14u 14u "📁"
  Pop $P_ICON1
  SendMessage $P_ICON1 ${WM_SETFONT} $FONT_ICON 0
  SetCtlColors $P_ICON1 ${WERSEE_ACCENT} ${WERSEE_BG}

  ${NSD_CreateCheckbox} 38u 66u 260u 11u "Wersee-map aanmaken in Documenten"
  Pop $P_CB1
  SendMessage $P_CB1 ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $P_CB1 ${WERSEE_TEXT} ${WERSEE_BG}
  ${NSD_Check} $P_CB1

  ${NSD_CreateLabel} 38u 79u 260u 18u "Facturen, storage-bestanden, product-afbeeldingen, proposals, contracts, cache & logs — allemaal lokaal beschikbaar."
  Pop $P_DESC1
  SendMessage $P_DESC1 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_DESC1 ${WERSEE_MUTED} ${WERSEE_BG}

  ; ── 2. Achtergrondprocessen ──
  ${NSD_CreateLabel} 20u 102u 14u 14u "🔄"
  Pop $P_ICON2
  SendMessage $P_ICON2 ${WM_SETFONT} $FONT_ICON 0
  SetCtlColors $P_ICON2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}

  ${NSD_CreateCheckbox} 38u 102u 260u 11u "Achtergrondprocessen draaien"
  Pop $P_CB2
  SendMessage $P_CB2 ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $P_CB2 ${WERSEE_TEXT} ${WERSEE_BG}
  ${NSD_Check} $P_CB2

  ${NSD_CreateLabel} 38u 115u 260u 18u "Auto-sync met cloud, real-time notificaties (jobs, proposals, messages) & automatische uploads."
  Pop $P_DESC2
  SendMessage $P_DESC2 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_DESC2 ${WERSEE_MUTED} ${WERSEE_BG}

  ; ── 3. Auto-start ──
  ${NSD_CreateLabel} 20u 138u 14u 14u "🚀"
  Pop $P_ICON3
  SendMessage $P_ICON3 ${WM_SETFONT} $FONT_ICON 0
  SetCtlColors $P_ICON3 ${WERSEE_PINK} ${WERSEE_BG}

  ${NSD_CreateCheckbox} 38u 138u 260u 11u "Automatisch starten met Windows"
  Pop $P_CB3
  SendMessage $P_CB3 ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $P_CB3 ${WERSEE_TEXT} ${WERSEE_BG}
  ${NSD_Check} $P_CB3

  ${NSD_CreateLabel} 38u 151u 260u 18u "Wersee start stil op de achtergrond bij het inloggen in Windows — klaar in de system tray."
  Pop $P_DESC3
  SendMessage $P_DESC3 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_DESC3 ${WERSEE_MUTED} ${WERSEE_BG}

  ; ── 4. Desktop ──
  ${NSD_CreateLabel} 20u 174u 14u 14u "🖥"
  Pop $P_ICON4
  SendMessage $P_ICON4 ${WM_SETFONT} $FONT_ICON 0
  SetCtlColors $P_ICON4 ${WERSEE_SUCCESS_HOT} ${WERSEE_BG}

  ${NSD_CreateCheckbox} 38u 174u 260u 11u "Bureaublad-snelkoppeling & bestandstoegang"
  Pop $P_CB4
  SendMessage $P_CB4 ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $P_CB4 ${WERSEE_TEXT} ${WERSEE_BG}
  ${NSD_Check} $P_CB4

  ${NSD_CreateLabel} 38u 187u 260u 10u "Een snelkoppeling op je bureaublad — geen rommel, alleen wat je nodig hebt."
  Pop $P_DESC4
  SendMessage $P_DESC4 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $P_DESC4 ${WERSEE_MUTED} ${WERSEE_BG}

  StrCpy $P_TICK 0
  ${NSD_CreateTimer} werseePermissionsTick 380

  nsDialogs::Show
FunctionEnd

Function werseePermissionsTick
  IntOp $P_TICK $P_TICK + 1
  IntOp $0 $P_TICK % 4

  ${If} $0 == 0
    SetCtlColors $P_ICON1 ${WERSEE_ACCENT}      ${WERSEE_BG}
    SetCtlColors $P_ICON2 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON3 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON4 ${WERSEE_DIM}         ${WERSEE_BG}
  ${ElseIf} $0 == 1
    SetCtlColors $P_ICON1 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
    SetCtlColors $P_ICON3 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON4 ${WERSEE_DIM}         ${WERSEE_BG}
  ${ElseIf} $0 == 2
    SetCtlColors $P_ICON1 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON2 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON3 ${WERSEE_PINK}        ${WERSEE_BG}
    SetCtlColors $P_ICON4 ${WERSEE_DIM}         ${WERSEE_BG}
  ${Else}
    SetCtlColors $P_ICON1 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON2 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON3 ${WERSEE_DIM}         ${WERSEE_BG}
    SetCtlColors $P_ICON4 ${WERSEE_SUCCESS_HOT} ${WERSEE_BG}
  ${EndIf}

  System::Call 'user32::InvalidateRect(i $P_ICON1, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $P_ICON2, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $P_ICON3, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $P_ICON4, i 0, i 1)'
FunctionEnd

Function werseePermissionsLeave
  ${NSD_KillTimer} werseePermissionsTick

  ${NSD_GetState} $P_CB1 $P_STATE_DOCS
  ${NSD_GetState} $P_CB2 $P_STATE_BG
  ${NSD_GetState} $P_CB3 $P_STATE_AUTOSTART
  ${NSD_GetState} $P_CB4 $P_STATE_DESKTOP
FunctionEnd

; ════════════════════════════════════════════════════════════════════
;  INSTALL — apply chosen permissions
; ════════════════════════════════════════════════════════════════════

!macro customInstall
  DetailPrint "────────────────────────────────────────"
  DetailPrint "  Wersee — preparing your workspace"
  DetailPrint "────────────────────────────────────────"
  DetailPrint "  ◆  Unpacking modules..."
  DetailPrint "  ◆  Registering protocols..."
  DetailPrint "  ◆  Installing shortcuts..."

  ; 1. Documents\Wersee folder tree
  ${If} $P_STATE_DOCS == ${BST_CHECKED}
    DetailPrint "  ◆  Creating Documents\Wersee folder tree..."
    CreateDirectory "$DOCUMENTS\Wersee"
    CreateDirectory "$DOCUMENTS\Wersee\Invoices"
    CreateDirectory "$DOCUMENTS\Wersee\Storage"
    CreateDirectory "$DOCUMENTS\Wersee\ProductImages"
    CreateDirectory "$DOCUMENTS\Wersee\Proposals"
    CreateDirectory "$DOCUMENTS\Wersee\Contracts"
    CreateDirectory "$DOCUMENTS\Wersee\Cache"
    CreateDirectory "$DOCUMENTS\Wersee\Logs"

    ; Drop a README so users know what this folder is
    FileOpen $0 "$DOCUMENTS\Wersee\README.txt" w
    FileWrite $0 "Wersee Workspace$\r$\n"
    FileWrite $0 "=================$\r$\n$\r$\n"
    FileWrite $0 "This folder holds your local Wersee files:$\r$\n$\r$\n"
    FileWrite $0 "  Invoices       Local copies of invoices from your Wersee account$\r$\n"
    FileWrite $0 "  Storage        Files from the Wersee Storage feature$\r$\n"
    FileWrite $0 "  ProductImages  Copies of product images you upload$\r$\n"
    FileWrite $0 "  Proposals      Proposals exported from your workspace$\r$\n"
    FileWrite $0 "  Contracts      Signed & draft contracts$\r$\n"
    FileWrite $0 "  Cache          Temporary files for performance$\r$\n"
    FileWrite $0 "  Logs           Debug & activity logs$\r$\n$\r$\n"
    FileWrite $0 "You can safely move or delete this folder; Wersee will$\r$\n"
    FileWrite $0 "recreate what it needs on next launch.$\r$\n"
    FileClose $0
  ${EndIf}

  ; 2. Auto-start with Windows (silent launch)
  ${If} $P_STATE_AUTOSTART == ${BST_CHECKED}
    DetailPrint "  ◆  Enabling auto-start with Windows..."
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Wersee" '"$INSTDIR\${PRODUCT_FILENAME}.exe" --autostart --hidden'
  ${EndIf}

  ; 3. Write permissions manifest so Electron app can read it
  DetailPrint "  ◆  Writing permissions manifest..."
  CreateDirectory "$APPDATA\Wersee"
  FileOpen $0 "$APPDATA\Wersee\permissions.json" w
  FileWrite $0 "{$\r$\n"
  FileWrite $0 '  "version": "1.2",$\r$\n'
  ${If} $P_STATE_DOCS == ${BST_CHECKED}
    FileWrite $0 '  "documentsFolder": true,$\r$\n'
  ${Else}
    FileWrite $0 '  "documentsFolder": false,$\r$\n'
  ${EndIf}
  ${If} $P_STATE_BG == ${BST_CHECKED}
    FileWrite $0 '  "backgroundProcesses": true,$\r$\n'
  ${Else}
    FileWrite $0 '  "backgroundProcesses": false,$\r$\n'
  ${EndIf}
  ${If} $P_STATE_AUTOSTART == ${BST_CHECKED}
    FileWrite $0 '  "autoStart": true,$\r$\n'
  ${Else}
    FileWrite $0 '  "autoStart": false,$\r$\n'
  ${EndIf}
  ${If} $P_STATE_DESKTOP == ${BST_CHECKED}
    FileWrite $0 '  "desktop": true$\r$\n'
  ${Else}
    FileWrite $0 '  "desktop": false$\r$\n'
  ${EndIf}
  FileWrite $0 "}$\r$\n"
  FileClose $0

  DetailPrint "  ◆  Priming first launch..."
  DetailPrint "────────────────────────────────────────"
  DetailPrint "  Almost there — ready in a moment."
!macroend

; ════════════════════════════════════════════════════════════════════
;  CUSTOM FINISH PAGE
; ════════════════════════════════════════════════════════════════════

!macro customFinishPage
  Page custom werseeFinishShow werseeFinishLeave
!macroend

Function werseeFinishShow
  nsDialogs::Create 1018
  Pop $WERSEE_DIALOG
  ${If} $WERSEE_DIALOG == error
    Abort
  ${EndIf}

  SetCtlColors $WERSEE_DIALOG ${WERSEE_TEXT} ${WERSEE_BG}

  CreateFont $FONT_TITLE_XL   "Segoe UI" 30 800
  CreateFont $FONT_HEADING    "Segoe UI" 13 600
  CreateFont $FONT_BODY       "Segoe UI" 10 400
  CreateFont $FONT_SMALL      "Segoe UI"  9 400
  CreateFont $FONT_CHECK_HUGE "Segoe UI" 52 900

  ${NSD_CreateLabel} 30u 22u 46u 50u "✓"
  Pop $F_CHECK
  SendMessage $F_CHECK ${WM_SETFONT} $FONT_CHECK_HUGE 0
  SetCtlColors $F_CHECK ${WERSEE_SUCCESS} ${WERSEE_BG}

  ${NSD_CreateLabel} 76u 22u 14u 14u "✦"
  Pop $F_SPARKLE1
  SendMessage $F_SPARKLE1 ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $F_SPARKLE1 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}

  ${NSD_CreateLabel} 20u 16u 10u 10u "✧"
  Pop $F_SPARKLE2
  SendMessage $F_SPARKLE2 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $F_SPARKLE2 ${WERSEE_PINK} ${WERSEE_BG}

  ${NSD_CreateLabel} 70u 60u 10u 10u "✧"
  Pop $F_SPARKLE3
  SendMessage $F_SPARKLE3 ${WM_SETFONT} $FONT_SMALL 0
  SetCtlColors $F_SPARKLE3 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}

  ${NSD_CreateLabel} 90u 28u 220u 28u "You're all set."
  Pop $F_TITLE
  SendMessage $F_TITLE ${WM_SETFONT} $FONT_TITLE_XL 0
  SetCtlColors $F_TITLE ${WERSEE_TEXT} ${WERSEE_BG}

  ${NSD_CreateLabel} 90u 62u 220u 16u "Wersee has been installed successfully."
  Pop $F_SUB
  SendMessage $F_SUB ${WM_SETFONT} $FONT_HEADING 0
  SetCtlColors $F_SUB ${WERSEE_MUTED} ${WERSEE_BG}

  ${NSD_CreateLabel} 30u 98u 280u 32u "Your workspace is ready. Sign in with Google, email, or your existing Wersee account to pick up where you left off."
  Pop $F_NOTE
  SendMessage $F_NOTE ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $F_NOTE ${WERSEE_MUTED} ${WERSEE_BG}

  ${NSD_CreateCheckbox} 30u 140u 280u 12u "Launch Wersee when I click Finish"
  Pop $F_RUN_CHECK
  SendMessage $F_RUN_CHECK ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $F_RUN_CHECK ${WERSEE_TEXT} ${WERSEE_BG}
  ${NSD_Check} $F_RUN_CHECK

  ${NSD_CreateLink} 30u 160u 280u 12u "Or sign in from the web at wersee.com/signin →"
  Pop $F_LINK
  SendMessage $F_LINK ${WM_SETFONT} $FONT_BODY 0
  SetCtlColors $F_LINK ${WERSEE_ACCENT_HOT} ${WERSEE_BG}
  ${NSD_OnClick} $F_LINK werseeOpenWebsite

  StrCpy $F_TICK 0
  ${NSD_CreateTimer} werseeFinishTick 350

  nsDialogs::Show
FunctionEnd

Function werseeFinishTick
  IntOp $F_TICK $F_TICK + 1
  IntOp $0 $F_TICK % 4

  ${If} $0 == 0
    SetCtlColors $F_CHECK ${WERSEE_SUCCESS}     ${WERSEE_BG}
    SetCtlColors $F_SPARKLE1 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE2 ${WERSEE_PINK}      ${WERSEE_BG}
    SetCtlColors $F_SPARKLE3 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}
  ${ElseIf} $0 == 1
    SetCtlColors $F_CHECK ${WERSEE_SUCCESS_HOT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE1 ${WERSEE_PINK}      ${WERSEE_BG}
    SetCtlColors $F_SPARKLE2 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE3 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
  ${ElseIf} $0 == 2
    SetCtlColors $F_CHECK ${WERSEE_ACCENT}      ${WERSEE_BG}
    SetCtlColors $F_SPARKLE1 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE2 ${WERSEE_ACCENT_SOFT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE3 ${WERSEE_PINK}      ${WERSEE_BG}
  ${Else}
    SetCtlColors $F_CHECK ${WERSEE_SUCCESS}     ${WERSEE_BG}
    SetCtlColors $F_SPARKLE1 ${WERSEE_ACCENT_HOT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE2 ${WERSEE_SUCCESS_HOT} ${WERSEE_BG}
    SetCtlColors $F_SPARKLE3 ${WERSEE_PINK}      ${WERSEE_BG}
  ${EndIf}

  System::Call 'user32::InvalidateRect(i $F_CHECK, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $F_SPARKLE1, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $F_SPARKLE2, i 0, i 1)'
  System::Call 'user32::InvalidateRect(i $F_SPARKLE3, i 0, i 1)'
FunctionEnd

Function werseeOpenWebsite
  ExecShell "open" "https://wersee.com/signin?source=desktop-installer"
FunctionEnd

Function werseeFinishLeave
  ${NSD_KillTimer} werseeFinishTick
  ${NSD_GetState} $F_RUN_CHECK $F_RUN_STATE
  ${If} $F_RUN_STATE == ${BST_CHECKED}
    Exec '"$INSTDIR\${PRODUCT_FILENAME}.exe"'
  ${EndIf}
FunctionEnd

!endif  ; !ifndef BUILD_UNINSTALLER

; ════════════════════════════════════════════════════════════════════
;  UNINSTALL WELCOME + cleanup
; ════════════════════════════════════════════════════════════════════

!macro customUnWelcomePage
  UninstPage custom un.werseeWelcomeShow
!macroend

!ifdef BUILD_UNINSTALLER
Function un.werseeWelcomeShow
  nsDialogs::Create 1018
  Pop $UN_DIALOG
  ${If} $UN_DIALOG == error
    Abort
  ${EndIf}

  SetCtlColors $UN_DIALOG 0xFFFFFF 0x0A0A0A

  CreateFont $0 "Segoe UI" 28 800
  CreateFont $1 "Segoe UI" 12 500
  CreateFont $2 "Segoe UI" 10 400

  ${NSD_CreateLabel} 30u 30u 280u 30u "Sad to see you go."
  Pop $UN_TITLE
  SendMessage $UN_TITLE ${WM_SETFONT} $0 0
  SetCtlColors $UN_TITLE 0xFFFFFF 0x0A0A0A

  ${NSD_CreateLabel} 30u 64u 280u 18u "This will remove Wersee from this PC."
  Pop $UN_SUB
  SendMessage $UN_SUB ${WM_SETFONT} $1 0
  SetCtlColors $UN_SUB 0x9CA3AF 0x0A0A0A

  ${NSD_CreateLabel} 30u 100u 280u 60u "Your Wersee account and all data on wersee.com stay safe — you can sign in from the web any time, or reinstall later. No questions asked."
  Pop $UN_NOTE
  SendMessage $UN_NOTE ${WM_SETFONT} $2 0
  SetCtlColors $UN_NOTE 0x9CA3AF 0x0A0A0A

  nsDialogs::Show
FunctionEnd
!endif  ; !ifdef BUILD_UNINSTALLER

!macro customUnInstall
  ; Remove auto-start entry (safe if absent)
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Wersee"
  ; Keep $DOCUMENTS\Wersee and $APPDATA\Wersee — user data is sacred.
!macroend
