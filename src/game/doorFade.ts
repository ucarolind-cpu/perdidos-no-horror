/** Sinaliza que a próxima tela deve surgir do preto (transição da porta). */
let pending = false;
export const requestDoorFadeIn = () => { pending = true; };
export const consumeDoorFadeIn = () => { const p = pending; pending = false; return p; };
