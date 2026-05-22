/**
 * Registo antecipado de ficheiros abertos pelo SO (PWA file_handlers / launchQueue).
 * Deve correr antes do React montar para não perder o primeiro ficheiro no Android.
 */

let uploadHandler = null;
const pendingBatches = [];

export function setFileLaunchUploadHandler(fn) {
  uploadHandler = fn;
  while (pendingBatches.length && uploadHandler) {
    const batch = pendingBatches.shift();
    uploadHandler(batch).catch(console.error);
  }
}

async function dispatchLaunchFiles(fileHandles) {
  if (!fileHandles?.length) return;
  const files = await Promise.all(
    [...fileHandles].map((handle) => handle.getFile())
  );
  if (uploadHandler) {
    await uploadHandler(files);
  } else {
    pendingBatches.push(files);
  }
}

export function initFileLaunchQueue() {
  if (!("launchQueue" in window)) return;
  window.launchQueue.setConsumer((launchParams) => {
    dispatchLaunchFiles(launchParams.files).catch(console.error);
  });
}
