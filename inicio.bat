@echo off
REM Cambia la codificación a UTF-8
@chcp 65001 >nul
setlocal enabledelayedexpansion

REM Cambia si tu contenedor tiene otro nombre
set "MONGO_CONTAINER=mongodb"
set "BACKUP_DIR=backups"

REM Carga las variables del .env si existe
if exist .env (
    for /f "usebackq delims=" %%L in (".env") do (
        set "line=%%L"
        for /f "tokens=1,* delims==" %%A in ("!line!") do (
            set "%%A=%%B"
        )
    )
)

REM Extrae los datos de la variable .env MONGODB_URI
for /f %%A in ('powershell -NoProfile -Command "$uri='%MONGODB_URI%'; $m=[regex]::Match($uri, 'mongodb://(?<user>[^:]+):(?<pass>[^@]+)@[^/]+/(?<db>[^?]+)'); Write-Output ($m.Groups['user'].Value + '|' + $m.Groups['pass'].Value + '|' + $m.Groups['db'].Value)"') do (
    for /f "tokens=1,2,3 delims=|" %%U in ("%%A") do (
        set "MONGO_USER=%%U"
        set "MONGO_PASS=%%V"
        set "MONGO_DB=%%W"
    )
)

if "%1"=="-slash" (
    npm install
    node . slash
) else if "%1"=="-docker" (
    REM Construye la imagen y inicia el docker-compose
    docker compose up -d --build
) else if "%1" == "-backup" (
    for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"`) do set "DATE=%%A"
    set "BACKUP_FILE=%BACKUP_DIR%\mongo-backup-!DATE!.gz"
    if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

    echo Realizando backup de MongoDB en !BACKUP_FILE! ...

    docker exec %MONGO_CONTAINER% bash -c "mongodump --username=%MONGO_USER% --password=%MONGO_PASS% --db=%MONGO_DB% --authenticationDatabase=admin --archive=/tmp/backup.gz --gzip"
    if !ERRORLEVEL! NEQ 0 (
        echo ERROR: Falló mongodump
        exit /b 1
    )
    echo Copiando desde el contenedor a: !BACKUP_FILE!

    docker cp %MONGO_CONTAINER%:/tmp/backup.gz "!BACKUP_FILE!"
    if !ERRORLEVEL! NEQ 0 (
        echo ERROR: No se pudo copiar el backup desde el contenedor
        exit /b 1
    )

    docker exec %MONGO_CONTAINER% rm /tmp/backup.gz >nul

    echo Backup realizado correctamente
) else if "%1" == "-restore" (
    REM Es necesario un segundo argumento
    if "%2" == "" (
        echo ERROR: Debes especificar el archivo de backup para restaurar
        echo Uso: %~nx0 -restore nombre-backup.gz
        exit /b 1
    )

    set "RESTORE_FILE=%~2"
    for %%I in ("!RESTORE_FILE!") do set "RESTORE_FILE=%%~fI"

    if not exist "!RESTORE_FILE!" (
        echo ERROR: El archivo !RESTORE_FILE! no existe
        exit /b 1
    )

    echo Restaurando MongoDB desde !RESTORE_FILE! ...
    type "!RESTORE_FILE!" | docker exec -i %MONGO_CONTAINER% mongorestore --username=%MONGO_USER% --password=%MONGO_PASS% --authenticationDatabase=admin --archive --gzip --drop

    if !ERRORLEVEL! EQU 0 (
        echo Restauración completada correctamente
    ) else (
        echo ERROR: Falló la restauracion
    )
) else (
    echo Ejecutando el bot
    node .
    pause
)

endlocal
exit /b 0
