@echo off
REM Mock gvcore-cli for testing the Tauri integration on Windows
REM Simulates progress output in the format: [stage_name] percent%% - message

echo [frame_extraction] 0%% - Starting frame extraction...
timeout /t 1 /nobreak >nul

echo [frame_extraction] 5%% - Extracting frames...
timeout /t 1 /nobreak >nul
echo [frame_extraction] 10%% - Extracting frames...
timeout /t 1 /nobreak >nul
echo [frame_extraction] 15%% - Extracting frames...
timeout /t 1 /nobreak >nul
echo [frame_extraction] 19%% - Extracting frames...
timeout /t 1 /nobreak >nul

echo [colmap] 20%% - Running Structure from Motion...
timeout /t 1 /nobreak >nul
echo [colmap] 25%% - Processing COLMAP...
timeout /t 1 /nobreak >nul
echo [colmap] 30%% - Processing COLMAP...
timeout /t 1 /nobreak >nul
echo [colmap] 35%% - Processing COLMAP...
timeout /t 1 /nobreak >nul
echo [colmap] 38%% - Feature extraction complete
timeout /t 1 /nobreak >nul
echo [colmap] 39%% - Feature matching complete
timeout /t 1 /nobreak >nul

echo [brush] 40%% - Generating 3D Gaussian Splats...
timeout /t 1 /nobreak >nul
echo [brush] 50%% - Training Gaussian splats...
timeout /t 1 /nobreak >nul
echo [brush] 60%% - Training Gaussian splats...
timeout /t 1 /nobreak >nul
echo [brush] 70%% - Training Gaussian splats...
timeout /t 1 /nobreak >nul
echo [brush] 80%% - Training Gaussian splats...
timeout /t 1 /nobreak >nul
echo [brush] 90%% - Training Gaussian splats...
timeout /t 1 /nobreak >nul

echo [metadata] 95%% - Generating metadata...
timeout /t 1 /nobreak >nul

echo [completed] 100%% - Processing complete (1/1)

REM Parse output directory from args
set OUTPUT_DIR=
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--output" (
    set OUTPUT_DIR=%~2
    shift
)
shift
goto parse_args
:end_parse

if not "%OUTPUT_DIR%"=="" (
    if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
    echo mock ply data > "%OUTPUT_DIR%\output.ply"
)

exit /b 0
