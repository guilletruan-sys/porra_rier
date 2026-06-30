// Pantalla de mantenimiento global. Cambia MAINTENANCE_MODE a false cuando
// se quiera reabrir la web — todo lo demás se queda intacto y al deploy
// siguiente la app vuelve a funcionar normalmente.

export const MAINTENANCE_MODE = false

export const MAINTENANCE_MESSAGE = 'La web está fuera de servicio hasta que alguno recapacite'
