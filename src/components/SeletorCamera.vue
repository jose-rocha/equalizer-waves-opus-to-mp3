<script setup>
import { useQuasar } from 'quasar';
import { ref, computed, nextTick } from 'vue';

const $q = useQuasar();

const props = defineProps({
  showModalCamera: Boolean,
  imgCamera: Object,
});
const emits = defineEmits(['update:showModalCamera', 'isFrontOrBack', 'enviarImgBase64', 'rotateScreen']);

const modalCanvas = ref(false);
const maximizedToggle = ref(true);
const canvas = ref(null);
const legendaFoto = ref('');
const status = ref(0);
const showMudarCamera = ref(false);

const dialog = computed({
  get: () => props.showModalCamera,
  set: (val) => emits('update:showModalCamera', val),
});

const larguraTela = ref(window.innerWidth);
const alturaTela = ref(window.innerHeight);

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
  // Lista todas as fontes de mídia disponíveis
  (async () => {
    try {
      const midiasDisponiveis = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = midiasDisponiveis.filter((devices) => devices.kind === 'videoinput');

      if (videoDevices.length > 1) showMudarCamera.value = true;
      else showMudarCamera.value = false;
    } catch (error) {
      $q.dialog({
        title: 'Ops!',
        message: `Ocorreu um erro ao verificar as fontes de mídia: ${error?.message}`,
      });
    }
  })();
  // navigator.mediaDevices.enumerateDevices()
  //   .then((devices) => {
  //     const videoDevices = devices.filter((device) => device.kind === 'videoinput');

  //     if (videoDevices.length > 1) showMudarCamera.value = true;
  //     else showMudarCamera.value = false;
  //   })
  //   .catch((error) => {
  //     $q.dialog({
  //       title: 'Ops!',
  //       message: `Ocorreu um erro ao verificar as fontes de mídia: ${error}`,
  //     });
  //   });
}

const tirarFoto = () => {
  const drawImageProp = (ctx, vid) => {
    ctx?.setTransform(-1, 0, 0, 1, larguraTela.value, 0);
    ctx?.drawImage(vid, 0, 0, larguraTela.value, alturaTela.value);
    ctx?.restore();
  };

  setTimeout(() => {
    const context = canvas.value?.getContext('2d');
    drawImageProp(context, props.imgCamera);
  });
  modalCanvas.value = true;
};

window.addEventListener('orientationchange', () => {
  emits('rotateScreen');
});

const enviarImagem = async () => {
  const dadosBlob = await new Promise((resolve) => {
    canvas.value.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg');
  });

  const blobImage = await dadosBlob;

  // const hitlChatStore = useChatStore();

  // const fotoCamera = async () => (await fetch(
  //   `${process.env.API_BASE_URL}
  //   callback/web-chat/midia/${hitlChatStore?.token[window?.token]?.accessToken}`,
  //   {
  //     headers: {
  //       Authorization: `${window?.token}`,
  //       'Content-Type': 'image/jpeg',
  //     },
  //     method: 'POST',
  //     body: blobImage,
  //   },
  // )).json();

  // const retornoImg = await fotoCamera();

  // emits('enviarImgBase64', blobImage, retornoImg?.id_midia, legendaFoto.value);

  dialog.value = false;
  modalCanvas.value = false;

  return blobImage;
};

window.addEventListener('popstate', () => {
  console.log('popstate');
  emits('update:showModalCamera');
  dialog.value = false;
});

nextTick(() => {
  console.log(props);
});
</script>

<template>
  <div>
    <q-dialog
      v-model="dialog"
      persistent
      :maximized="maximizedToggle"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-black text-white">
        <q-bar den class="bg-black flex items-center q-pt-sm">
          <q-btn
            label="Voltar"
            icon="mdi-arrow-left"
            style="position: absolute; z-index: 2;"
            dense
            flat
            @click="emits('update:showModalCamera', status = 1)"
          >
            <q-tooltip class="bg-white text-primary">
              Fechar Câmera
            </q-tooltip>
          </q-btn>
        </q-bar>

        <div
          style="position: fixed; height: 100%; width: 100%;">
          <slot />

          <q-btn
            size="35px" flat icon="mdi-circle-slice-8"
            style="position: absolute; bottom: 2rem;z-index: 2;"
            :style="showMudarCamera ? 'left: 40%;' : 'left: 50%;'"
            @click="tirarFoto"
          >
            <q-tooltip class="bg-white text-primary">
              Tirar Foto
            </q-tooltip>
          </q-btn>

          <template v-if="showMudarCamera">
            <q-btn
              size="25px" flat icon="mdi-orbit-variant"
              style="
                position: absolute; bottom: 2.5rem;
                right: -0.3rem; z-index: 2;
              "
               class="rotate" @click="emits('isFrontOrBack')"
            >
              <q-tooltip class="bg-white text-primary">
                Mudar a Câmera
              </q-tooltip>
            </q-btn>
          </template>
        </div>
      </q-card>
    </q-dialog>

    <template v-if="modalCanvas">
      <q-dialog v-model="modalCanvas" class="bg-black " persistent>
        <q-card
          class="no-padding"
          style="
            overflow: hidden;
            position: relative; bottom: 1.4rem;
          "
        >
          <q-btn
            icon="mdi-delete"
            color="primary" round
            style="
              position: fixed; z-index: 2;
              left: 5px; top: 5px;
            "
            dense
            @click="modalCanvas = false" size="13px"
          />

            <canvas
              ref="canvas"
              :width="larguraTela"
              :height="alturaTela"
              style="object-fit: fill; position: fixed; left: 0; top: 0;"
            />
            <q-card-actions
              class="flex full-width"
              style="
                position: fixed; bottom:0;
                gap: 5px; left: 0; z-index: 5;
              "
            >
              <q-input
                outlined
                v-model="legendaFoto"
                class="full-width"
                input-class="text-black"
                label="Adicionar texto"
                style="flex: 9; background-color:rgb(255, 255, 255, 0.5);"
                @keyup.enter="enviarImagem"
              />
              <q-btn
                flat
                round
                icon="send"
                class="bg-primary"
                color="white"
                @click="enviarImagem"
              />
            </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </div>
</template>
