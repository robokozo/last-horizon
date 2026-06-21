<script setup lang="ts">
import type { PatchEntry, PatchNoteKind } from '@/data/patchNotes'

defineProps<{ entry: PatchEntry }>()
defineEmits<{ close: [] }>()

const KIND_STYLES: Record<PatchNoteKind, string> = {
  new: 'bg-lime-400/15 text-lime-300 border-lime-400/30',
  balance: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  fix: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
}

const KIND_LABELS: Record<PatchNoteKind, string> = {
  new: 'New',
  balance: 'Balance',
  fix: 'Fix',
}

function formatDate({ iso }: { iso: string }): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      class="my-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
    >
      <header class="flex flex-col gap-1">
        <p class="text-xs font-bold uppercase tracking-widest text-sky-400">What's new</p>
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-2xl font-black text-slate-100">{{ entry.title }}</h2>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ formatDate({ iso: entry.date }) }}
          </p>
        </div>
        <p v-if="entry.blurb !== undefined" class="text-sm italic text-slate-400">
          {{ entry.blurb }}
        </p>
      </header>

      <ul class="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
        <li v-for="(note, index) in entry.notes" :key="index" class="flex items-start gap-2.5">
          <span
            class="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            :class="KIND_STYLES[note.kind]"
          >
            {{ KIND_LABELS[note.kind] }}
          </span>
          <p class="text-sm leading-relaxed text-slate-300">{{ note.text }}</p>
        </li>
      </ul>

      <footer class="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <RouterLink
          to="/patch-notes"
          class="text-xs font-semibold text-slate-400 transition hover:text-slate-200"
          @click="$emit('close')"
        >
          📜 All patch notes
        </RouterLink>
        <button
          type="button"
          class="cursor-pointer rounded-xl bg-sky-500 px-6 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-400"
          @click="$emit('close')"
        >
          Got it
        </button>
      </footer>
    </div>
  </div>
</template>
