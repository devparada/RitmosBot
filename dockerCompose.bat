@echo off

REM Construye la imagen y inicia el docker-compose
docker build -t ritmosbot:latest .
docker-compose up -d
