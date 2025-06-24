<div align="center">

<img src="https://github.com/devparada/RitmosBot/blob/main/img/logo.png?raw=true" width=160>

# RitmosBot
Bot de música que permite a los usuarios disfrutar de su música en Discord

</div>

> [!NOTE]
> Este bot está en desarrollo

## 🎵 Características

- Streaming de alta calidad: Reproduce música de Youtube y Spotify con alta calidad.
- Mensajes embed sobre la canción que se está reproduciendo o cuando se skipea por ejemplo.
- Comandos de reproducción: Fácil de usar con comandos slash /play, /skip, /stop, /queue y /shuffle.

## ⚙️ Instalación

1. **Clona el repositorio**  
   ```bash
   git clone https://github.com/devparada/RitmosBot.git
   cd RitmosBot
   ```
2. **Instala las dependencias (solo las de producción)**  
   ```bash
   npm install --omit=dev
   ```
3. **Configura tus variables de entorno**

   Modifica el archivo `env` con tus variables de entorno y cambia la variable `ENVIROMENT` a `production`.

4. **Compila los archivos .ts**
   ```bash
   npm run build
   ```

5. **Inicia el bot**  
   ```bash
   node .
   ```

> **💡 Consejo:** Si quieres ejecutar los tests o aplicar ESLint, instala todas las dependencias:  
> ```bash
> npm install
> ```

## 🚀 Tecnologías

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-323330?style=for-the-badge&logo=Jest&logoColor=white)

## 📄 Licencia

Este proyecto está bajo la licencia GPL v3. Puedes ver el archivo [Licencia](https://github.com/devparada/RitmosBot/blob/main/LICENSE) para ver más detalles.
