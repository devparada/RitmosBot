/**
 * Obtiene de manera segura una variable de entorno.
 * @param name El nombre de la variable de entorno.
 * @param fallback Un valor opcional a usar si la variable no está definida.
 * @returns El valor de la variable de entorno.
 */
export function getEnvVar(name: string, fallback?: string): string {
    const value = process.env[name];
    if (value !== undefined && value !== "") return value;
    if (fallback !== undefined) return fallback;
    throw new Error(`La variable de entorno "${name}" no está definida y no se proporcionó fallback`);
}
