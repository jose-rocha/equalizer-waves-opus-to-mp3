let linkAudioFrontOgg = null;

onmessage = (e) => {
  linkAudioFrontOgg = e.data;  // postMessage({ status: 'done', result: e.data });
}

importScripts('opustowavasm.js');

Module['onRuntimeInitialized'] = function () {
  const opustowav = Module.cwrap('opustowav', 'number', ['string', 'string']);

  FS.mkdir('/working'); // Criando diretório na memória do emscripten
  FS.mount(MEMFS, { root: '.' }, '/working');
  FS.chdir('/working');

  const oReq = new XMLHttpRequest();
  oReq.responseType = 'arraybuffer';
  oReq.addEventListener('load', function () {
    if (oReq.status === 200) {
      const arrayBuffer = oReq.response;

      if (arrayBuffer) {
        FS.writeFile('/working/audio.ogg', new Uint8Array(arrayBuffer), {
          encoding: 'binary',
        });

        opustowav('/working/audio.ogg', '/working/audio.mp3'); // Crie a URL do objeto a partir de mp3

        const blob = new Blob([FS.readFile('/working/audio.mp3')], {
          type: 'audio/mpeg',
        });
        postMessage({ status: 'done', result: URL.createObjectURL(blob) });
      }
    }
  });
  oReq.open('GET', linkAudioFrontOgg);
  oReq.send();
};
