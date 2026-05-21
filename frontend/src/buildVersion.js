/**
 * Incrementar BUILD_SEQ a cada commit/deploy que o usuário deve ver na web.
 * (A Vercel usa clone raso — git rev-list dava v10 fixo.)
 */
export const BUILD_SEQ = 25;
export const BUILD_LABEL = `v${BUILD_SEQ}`;
