; ---------------------------------------------------------------------------
; Jotbunker NSIS Installer Customization
; ---------------------------------------------------------------------------

!macro customInstall
  ; Check if the firewall rule already exists (skip prompt on upgrades)
  nsExec::ExecToStack 'netsh advfirewall firewall show rule name="Jotbunker"'
  Pop $0
  StrCmp $0 "0" _doneRule

  ; Rule doesn't exist — ask user before creating it
  MessageBox MB_YESNO "Jotbunker syncs with your phone over your local Wi-Fi network.$\n$\nTo allow this, a Windows Firewall exception is needed for the Jotbunker app (TCP, private networks only).$\n$\nBy default, the sync server listens on port 8080. You can change this during first-run setup or later in Settings. No firewall update is needed when you change the port — the rule is application-based, not port-based.$\n$\nCreate the firewall rule now?" IDYES _addRule IDNO _skipRule
  _addRule:
    nsExec::ExecToStack 'netsh advfirewall firewall add rule name="Jotbunker" dir=in action=allow program="$INSTDIR\Jotbunker.exe" protocol=TCP profile=any enable=yes'
    Pop $0
    Goto _doneRule
  _skipRule:
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
