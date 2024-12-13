#!/bin/bash

if [[ $1 == "-slash" ]]
then
    node . slash
elif [[ $1 == "-docker" ]]
then
    # Construye la imagen y inicia el docker-compose
    docker compose up -d --build
else
    # Ejecuta el bot
    node .
fi
