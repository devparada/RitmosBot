#!/bin/bash

if [[ $1 == "-slash" ]]
then
    node . slash
elif [[ $1 == "-docker" ]]
then
    # Construye la imagen y inicia el docker-compose
    docker build -t ritmosbot:latest .
    docker compose up -d
else
    # Ejecuta el bot
    node .
fi
