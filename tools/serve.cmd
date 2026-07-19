@echo off
set ELECTRON_RUN_AS_NODE=1
"%LOCALAPPDATA%\Programs\moises-desktop\Moises.exe" "%~dp0serve.js" %1
