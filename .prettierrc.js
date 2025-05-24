module.exports = {
    singleQuote: false, // Usa comillas dobles para evitar conflictos con eslint
    semi: true, // Añade punto y como al final de cada línea
    printWidth: 120, // Longitud máxima por línea antes de dar un salto automático
    tabWidth: 4, // Número de espacios por indentación
    trailingComma: "all", // Añade comas al final de listas, objetos, etc.
    proseWrap: "preserve", // Mantiene los saltos de línea en los párrafos de Markdown
    useTabs: false, // Usa espacios en vez de tabulaciones
    bracketSpacing: true, // Añade espacio dentro de las llaves en objetos
    arrowParens: "always", // Siempre usa paréntesis en funciones flecha, incluso con un solo parámetro
    endOfLine: "lf", // Usa el salto de línea tipo Unix (LF) para evitar problemas entre distintos sistemas operativos
    plugins: ["prettier-plugin-packagejson"], // Plugins adicionales para formatear archivos específicos (como package.json)
    overrides: [
        {
            files: "package.json",
            options: {
                parser: "json", // Usa el parser JSON estándar para este archivo
                tabWidth: 2,
            },
        },
        {
            files: "eslint.config.mjs",
            options: {
                tabWidth: 2,
            },
        },
    ],
};
