#!/bin/bash

MONGO_CONTAINER="mongodb" # Cambia si tu contenedor tiene otro nombre
BACKUP_DIR="./backups"

# Carga las variables del .env si existe
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Extrae los datos de la variable .env MONGODB_URI
MONGO_URI_REGEX="^mongodb:\/\/([^:]+):([^@]+)@[^/]+\/([^?]+)"
if [[ $MONGODB_URI =~ $MONGO_URI_REGEX ]]; then
  MONGO_USER="${BASH_REMATCH[1]}"
  MONGO_PASS="${BASH_REMATCH[2]}"
  MONGO_DB="${BASH_REMATCH[3]}"
else
  echo "ERROR: No se pudo extraer usuario, contraseña o base de datos desde MONGODB_URI"
  exit 1
fi


echo Bienvenido al menú de configuración del bot
echo ===========================================
echo 1: Recrear los comandos slash
echo 2: Recrear los contenedores docker
echo 3: Backup de mongodb
echo 4: Restaurar mongodb
echo ===========================================
read -p "Selecciona una opcion:" opcion

case $opcion in
1)
    npm install
    npm run build
    node . slash
    ;;

2)
    # Construye la imagen y inicia el docker-compose
    docker compose up -d --build
    ;;

3)
    DATE=$(date +%Y-%m-%d_%H-%M-%S)
    BACKUP_FILE="$BACKUP_DIR/mongo-backup-$DATE.gz"
    mkdir -p "$BACKUP_DIR"
    echo "Realizando backup de MongoDB en $BACKUP_FILE ..."

    if docker exec "$MONGO_CONTAINER" bash -c "mongodump --username='$MONGO_USER' --password='$MONGO_PASS' --db='$MONGO_DB' --authenticationDatabase=admin --archive --gzip" > "$BACKUP_FILE"
    then
        echo "Backup realizado correctamente"
    else
        echo "ERROR: Falló la creación del backup" >&2
    fi
    ;;

4)
    # Es necesario un segundo argumento
    if [ -z "$2" ]
    then
        echo "ERROR: Debes especificar el archivo de backup para restaurar"
        echo "Uso: $0 -restore nombre-backup.gz"
        exit 1
    fi

    RESTORE_FILE="$BACKUP_DIR/$2"
    if [ ! -f "$RESTORE_FILE" ]
    then
        echo "ERROR: El archivo $RESTORE_FILE no existe"
        exit 1
    fi

    echo "Restaurando MongoDB desde $RESTORE_FILE ..."
    if cat "$RESTORE_FILE" | docker exec -i "$MONGO_CONTAINER" bash -c "mongorestore --username='$MONGO_USER' --password='$MONGO_PASS' --db='$MONGO_DB' --authenticationDatabase=admin --archive --gzip --drop"
    then
        echo "Restauración completada correctamente"
    else
        echo "ERROR: Falló la restauración" >&2 
    fi
    ;;

*)
    echo "Opción no válida"
    ;;
esac
