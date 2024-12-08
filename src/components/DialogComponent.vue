<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';

const props = defineProps<{data: string[]}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const fullHeightAndWith = ref(true);
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :full-height="fullHeightAndWith"
    :full-width="fullHeightAndWith"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin column"
      style="height: 400px; overflow: hidden"
    >
      <q-card-section
        class="col flex bg-primary justify-between items-center q-py-none"
      >
        <q-icon
          name="img:/icons/favicon-128x128.png"
          size="2.5em"
        />

        <q-btn
          label="Fechar"
          icon-right="mdi-close"
          class="q-px-sm"
          color="white"
          no-caps
          outline
          dense
          rounded
          @click="onDialogCancel"
        />
      </q-card-section>

      <!-- todo:
        Caso queira usar o full-height e full-width fixos basta
        basta usar a classe col-9 no q-card-section sem condicional
      -->
      <q-card-section
        :class="[
          'full-width bg-grey-5 no-padding',
          fullHeightAndWith ? 'col-10' : 'col-9',
        ]"
        style="overflow-x: hidden; overflow-y: auto"
      >
          <q-list class="full-width">
            <q-item v-for="item in props.data" :key="item">
              <q-item-section>
                <q-item-label>{{ item }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
      </q-card-section>

      <q-card-section
        class="col flex bg-primary justify-between items-center q-py-none"
      >
        <q-icon
          name="img:/icons/favicon-128x128.png"
          size="2.5em"
        />

        <q-btn
          :icon-right="fullHeightAndWith ? 'fullscreen_exit' : 'fullscreen'"
          padding="5px"
          color="white"
          no-caps
          outline
          dense
          rounded
          @click="fullHeightAndWith = !fullHeightAndWith"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
