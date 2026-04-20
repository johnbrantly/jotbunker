; ---------------------------------------------------------------------------
; Jotbunker NSIS Installer Customization
; ---------------------------------------------------------------------------

!macro customInstall
  ; Does a "Jotbunker" rule already exist?
  nsExec::ExecToStack 'netsh advfirewall firewall show rule name="Jotbunker"'
  Pop $0
  StrCmp $0 "0" _reapplyRule _promptForNew

  _promptForNew:
    ; No rule yet — ask user before creating one.
    MessageBox MB_YESNO "Jotbunker syncs with your phone over your local Wi-Fi network.$\n$\nTo allow this, a Windows Firewall exception is needed for the Jotbunker app. The rule is scoped to TCP and limited to devices on your local network (LocalSubnet) — your computer stays unreachable from the public internet.$\n$\nBy default, the sync server listens on port 8080. You can change this during first-run setup or later in Settings. No firewall update is needed when you change the port — the rule is application-based, not port-based.$\n$\nCreate the firewall rule now?" IDYES _addRule IDNO _doneRule
    _addRule:
      nsExec::ExecToStack 'netsh advfirewall firewall add rule name="Jotbunker" dir=in action=allow program="$INSTDIR\Jotbunker.exe" protocol=TCP profile=domain,private,public remoteip=LocalSubnet enable=yes'
      Pop $0
      Goto _doneRule

  _reapplyRule:
    ; Rule already exists — user consented at original install. Silently
    ; replace so upgrades from 1.0.1-1.0.5 (shipped with profile=any) and
    ; from 1.0.6 (shipped with profile=private, which broke on Public-
    ; classified networks) get re-scoped to domain+private+public with
    ; remoteip=LocalSubnet. Idempotent on subsequent upgrades.
    nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="Jotbunker"'
    Pop $0
    nsExec::ExecToStack 'netsh advfirewall firewall add rule name="Jotbunker" dir=in action=allow program="$INSTDIR\Jotbunker.exe" protocol=TCP profile=domain,private,public remoteip=LocalSubnet enable=yes'
    Pop $0

  _doneRule:
!macroend

!macro customUnInstall
  ; perMachine uninstaller runs elevated — $APPDATA/$LOCALAPPDATA resolve to
  ; system paths (C:\ProgramData), not the user's profile. Use SHELL_CONTEXT
  ; and registry to find the real user profile paths.
  ReadRegStr $R1 HKCU "Volatile Environment" "APPDATA"
  ReadRegStr $R2 HKCU "Volatile Environment" "LOCALAPPDATA"

  ; Remove firewall rules (skip during silent/upgrade uninstall)
  IfSilent _skipFirewallDelete
  nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="Jotbunker"'
  Pop $0
  nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="jotbunker.exe" dir=in'
  Pop $0
  _skipFirewallDelete:

  ; Clean up auto-updater cache (user's LocalAppData, not system)
  RMDir /r "$R2\@jotbunkerdesktop-updater"

  ; Only prompt about AppData during a real uninstall (not upgrade)
  IfSilent _skipDataPrompt

  MessageBox MB_YESNO "Remove your Jotbunker app data and settings?$\n$\n(Your Backups, Tag Save Folder, and Downloads will not be touched.)" IDYES _removeData IDNO _skipDataPrompt
  _removeData:
    RMDir /r "$R1\Jotbunker"
  _skipDataPrompt:

  ; Clean up empty install directory left behind by NSIS
  RMDir "$INSTDIR"
!macroend
