@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Update produk GAWI dari export Shopee ===
echo.
node scripts\import-products.mjs
if errorlevel 1 goto end

echo.
set /p PUSH="Upload ke website sekarang? (y/n): "
if /i not "%PUSH%"=="y" goto end

git add products.json images
git commit -m "chore: update produk terlaris"
git push
echo.
echo Selesai. Website ter-update dalam 1-2 menit.

:end
echo.
pause
