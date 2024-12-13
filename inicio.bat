@echo off

if "%1"=="-slash" (
    node . slash
) else if "%1"=="-docker" (
    REM Construye la imagen y inicia el docker-compose
    docker compose up -d --build
) else (
    REM Ejecuta el bot
    node .
    pause
)
