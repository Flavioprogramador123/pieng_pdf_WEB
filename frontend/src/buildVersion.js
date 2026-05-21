/**
 * Incrementar BUILD_SEQ a cada deploy visível na web/mobile.
 * GIT_COMMIT é injetado no build (Vercel: VERCEL_GIT_COMMIT_SHA).
 */
export const BUILD_SEQ = 29;
export const GIT_COMMIT =
  typeof __GIT_COMMIT__ !== "undefined" ? __GIT_COMMIT__ : "dev";
export const BUILD_LABEL = `v${BUILD_SEQ}`;
export const BUILD_TITLE = `Build ${BUILD_LABEL} · ${GIT_COMMIT.slice(0, 7)}`;
