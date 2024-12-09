<script setup lang="js">
import { nextTick, ref } from 'vue';

import verificarPermissaoMicrofone from 'src/utils/permissions-mic';
import { createEchoDelayEffect, visualize, voiceChange } from 'src/utils/waves-mic';

const gravando = ref(false);
const audioBlobs = ref([]);
const mediaRecorder = ref(null);
const streamBeingCaptured = ref(null);
const audioFinal = ref(null);

const canvas = ref();
// const audioCtx = new AudioContext();
const drawVisual = ref(null);
const audioRecorder = {
  async iniciarGravacao() {
    const permissaoGavacaoMic = await verificarPermissaoMicrofone();

    if (!permissaoGavacaoMic?.id) return;

    gravando.value = true;
    streamBeingCaptured.value = permissaoGavacaoMic;
    mediaRecorder.value = new MediaRecorder(permissaoGavacaoMic);
    audioBlobs.value = [];

    mediaRecorder.value?.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        audioBlobs.value.push(event.data);
      }
    });

    mediaRecorder.value?.start();
    await nextTick(async () => {
      // console.log('Audio Recording started...', canvas.value);
      // await iniWaves2(permissaoGavacaoMic, canvas.value);

      const audioCtx = new AudioContext();
      const voiceSelect = document.getElementById('voice');
      const source = ref(null);
      // const stream = null;
      const analyser = audioCtx.createAnalyser();
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      const distortion = audioCtx.createWaveShaper();
      const gainNode = audioCtx.createGain();
      const biquadFilter = audioCtx.createBiquadFilter();
      const convolver = audioCtx.createConvolver();

      const echoDelay = createEchoDelayEffect(audioCtx);

      try {
        const response = await fetch(
          'https://mdn.github.io/voice-change-o-matic/audio/concert-crowd.ogg',
        );
        const arrayBuffer = await response.arrayBuffer();
        convolver.buffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error(
          `Unable to fetch the audio file:  Error: ${error.message}`,
        );
      }

      source.value = audioCtx.createMediaStreamSource(permissaoGavacaoMic);
      source.value.connect(distortion);
      distortion.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      convolver.connect(gainNode);
      echoDelay.placeBetween(gainNode, analyser);
      analyser.connect(audioCtx.destination);

      const canvasCtx = canvas.value?.getContext('2d');

      visualize(
        canvasCtx,
        canvas,
        analyser,
        drawVisual,
        'frequencybars',
        '#EEEEEE',
        '#21ba45',
      );
      voiceChange(
        voiceSelect,
        distortion,
        biquadFilter,
        convolver,
        echoDelay,
        audioCtx,
        gainNode,
      );
    });
  },
  async stopStream() {
    streamBeingCaptured.value?.getTracks().forEach((track) => {
      track.stop();
    });
  },
  async resetRecorderProperties() {
    // audioBlobs.value = [];
    mediaRecorder.value = null;
    streamBeingCaptured.value = null;
  },
  async stop() {
    return new Promise((resolve) => {
      // const mimeType = mediaRecorder.value?.mimeType;

      mediaRecorder.value?.addEventListener('stop', () => {
        const audioBlob = new Blob(audioBlobs.value, { type: 'audio/ogg; codecs=opus' });
        // const audioBlob = new Blob(audioBlobs.value, { type: 'audio/mpeg;' });
        audioFinal.value = URL.createObjectURL(audioBlob);
        // const audio = new Audio(audioFinal.value);
        // audio.play();
        resolve(audioBlob);
      });

      mediaRecorder.value?.stop();
      this.stopStream();
      this.resetRecorderProperties();
    });
  },
  limparGravacao() { // cancel
    console.log('Canceling Audio Recording...');
    mediaRecorder.value?.stop();
    audioRecorder.stopStream();
    audioRecorder.resetRecorderProperties();

    audioFinal.value = null;
  },
};

function stopAudioRecording() {
  gravando.value = false;

  console.log('Stopping Audio Recording...');
  audioRecorder.stop()
    .then((audioAsblob) => {
      console.log('stopped with audio Blob:', audioAsblob);
    })
    .catch((error) => {
      switch (error.name) {
        case 'InvalidStateError':
          console.log('An InvalidStateError has occured.');
          break;
        default:
          console.log(`An error occured with the error name ${error.name}`);
      }
    });
}
</script>

<template>
  <q-page class="flex-center q-py-md bg-grey">
<!--    <audio ref="audioElement" src="/audio_teste.ogg"></audio>-->
    <q-card class="row flex-center">
      <q-card-section
        class="row flex-center q-gutter-x-sm"
      >
        <template v-if="audioFinal">
          <audio
            :src="audioFinal"
            style="height: 55px;"
            controls
          >
            Seu navegador não suporta playback de audio.
          </audio>

          <q-btn
            outline
            round
            color="negative"
            icon="mdi-trash-can"
            @click="audioRecorder.limparGravacao"
          />
        </template>

        <template v-if="gravando">
          <canvas
            ref="canvas"
            class="visualizer"
            width="640"
            height="100"
          />
          <span >
            Gravando áudio
            <!-- Aqui vai ser adicionado as ondas-->
          </span>

          <q-btn
            v-if="gravando"
            outline
            round
            color="primary"
            icon="mdi-stop"
            @click="stopAudioRecording"
          />
        </template>

        <q-btn
          v-else
          outline
          round
          color="primary"
          icon="mdi-microphone"
          @click="audioRecorder.iniciarGravacao"
        />

      </q-card-section>
    </q-card>

  </q-page>
</template>
