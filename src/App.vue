<script setup lang="ts">
import { useDocumentVisibility } from '@vueuse/core'
import { watch } from 'vue'

import { soundEngine } from '@/game/sound'

// phone calls and app switches hide the tab — silence audio there and
// restore it on return (without touching the user's own mute setting)
const visibility = useDocumentVisibility()
watch(visibility, (state) => {
  soundEngine.setBackgrounded({ isBackgrounded: state === 'hidden' })
})
</script>

<template>
  <RouterView />
</template>
