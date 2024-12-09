function createEchoDelayEffect(audioContext: AudioContext) {
  const delay = audioContext.createDelay(1);
  const dryNode = audioContext.createGain();
  const wetNode = audioContext.createGain();
  const mixer = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  delay.delayTime.value = 0.75;
  dryNode.gain.value = 1;
  wetNode.gain.value = 0;
  filter.frequency.value = 1100;
  filter.type = 'highpass';
  return {
    apply() {
      wetNode.gain.setValueAtTime(0.75, audioContext.currentTime);
    },
    discard() {
      wetNode.gain.setValueAtTime(0, audioContext.currentTime);
    },
    isApplied() {
      return wetNode.gain.value > 0;
    },
    placeBetween(inputNode: AudioNode, outputNode: AudioNode) {
      inputNode.connect(delay);
      delay.connect(wetNode);
      wetNode.connect(filter);
      filter.connect(delay);

      inputNode.connect(dryNode);
      dryNode.connect(mixer);
      wetNode.connect(mixer);
      mixer.connect(outputNode);
    },
  };
}

function makeDistortionCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 50;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  let i = 0;
  let x;
  for (; i < nSamples; ++i) {
    x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function visualize(
  canvasCtx: CanvasRenderingContext2D | null,
  canvas: { value: HTMLCanvasElement },
  analyser: AnalyserNode,
  drawVisual: { value: number },
  visualSetting: string,
  backgroundWave: string,
  colorWaves: string,
) {
  const WIDTH = canvas.value?.width;
  const HEIGHT = canvas.value?.height;

  // const visualSetting = visualSelect.value;
  // console.log(visualSetting);

  if (visualSetting === 'sinewave') {
    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    console.log(bufferLength);

    // We can use Float32Array instead of Uint8Array if we want higher precision
    // const dataArray = new Float32Array(bufferLength);
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx?.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = () => {
      drawVisual.value = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      if (canvasCtx) {
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(181,172,172)';

        canvasCtx.beginPath();
      }

      const sliceWidth = (WIDTH * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
          canvasCtx?.moveTo(x, y);
        } else {
          canvasCtx?.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx?.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx?.stroke();
    };

    draw();
  } else if (visualSetting === 'frequencybars') {
    analyser.fftSize = 256;
    const bufferLengthAlt = analyser.frequencyBinCount;
    // console.log(bufferLengthAlt);

    // See comment above for Float32Array()
    const dataArrayAlt = new Uint8Array(bufferLengthAlt);

    canvasCtx?.clearRect(0, 0, WIDTH, HEIGHT);

    const drawAlt = () => {
      drawVisual.value = requestAnimationFrame(drawAlt);

      analyser.getByteFrequencyData(dataArrayAlt);

      if (canvasCtx) {
        // canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillStyle = backgroundWave;

        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLengthAlt; i++) {
        const barHeight = dataArrayAlt[i];

        if (canvasCtx) {
          // canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
          canvasCtx.fillStyle = colorWaves;
          // console.log(canvasCtx.fillStyle);
          canvasCtx.fillRect(
            x,
            HEIGHT - barHeight / 2,
            barWidth,
            barHeight / 2,
          );

          x += barWidth + 1;
        }
      }
    };

    drawAlt();
  }
  // else if (visualSetting == 'off') {
  //   canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  //   canvasCtx.fillStyle = 'red';
  //   canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  // }
}

function voiceChange(
  voiceSelect: HTMLSelectElement,
  distortion: WaveShaperNode,
  biquadFilter: BiquadFilterNode,
  convolver: ConvolverNode,
  echoDelay: ReturnType<typeof createEchoDelayEffect>,
  audioCtx: AudioContext,
  gainNode: GainNode,
) {
  distortion.oversample = '4x';
  biquadFilter.gain.setTargetAtTime(0, audioCtx.currentTime, 0);

  // const voiceSetting = voiceSelect.value;
  const voiceSetting = 'distortion';
  // console.log(voiceSetting);

  if (echoDelay.isApplied()) {
    echoDelay.discard();
  }

  // When convolver is selected it is connected back into the audio path
  // if (voiceSetting === 'convolver') {
  //   biquadFilter.disconnect(0);
  //   biquadFilter.connect(convolver);
  // } else {
  biquadFilter.disconnect(0);
  biquadFilter.connect(gainNode);

  if (voiceSetting === 'distortion') {
    distortion.curve = makeDistortionCurve(400);
  } else if (voiceSetting === 'biquad') {
    biquadFilter.type = 'lowshelf';
    biquadFilter.frequency.setTargetAtTime(1000, audioCtx.currentTime, 0);
    biquadFilter.gain.setTargetAtTime(25, audioCtx.currentTime, 0);
  } else if (voiceSetting === 'delay') {
    echoDelay.apply();
  } else if (voiceSetting === 'off') {
    console.log('Voice settings turned off');
  }
  // }
}

export {
  createEchoDelayEffect, makeDistortionCurve, visualize, voiceChange,
};
