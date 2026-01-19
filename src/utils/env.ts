/**
 * Obtiene de manera segura una variable de entorno.
 * @param name El nombre de la variable de entorno.
 * @returns El valor de la variable de entorno.
 */
export function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`La variable de entorno ${name} no está definida`);
    return value;
}
