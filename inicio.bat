@echo off

if "%1"=="-slash" (
    node . slash
) else if "%1"=="-docker" (
    REM Construye la imagen y inicia el docker-compose
    docker build -t ritmosbot:latest .
    docker-compose up -d
) else (
    REM Ejecuta el bot
    node .
    pause
)
