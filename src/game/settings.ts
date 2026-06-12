import { useLocalStorage } from '@vueuse/core'

/**
 * Visual-preference toggles shared by the Vue UI and the Phaser scene.
 * Module-level refs so the scene can read `.value` without a Pinia context;
 * VueUse persists them to localStorage.
 */
export const screenShakeEnabled = useLocalStorage<boolean>('pd-screen-shake', true)
// on by default; the key changed when the default flipped to true, so players
// who never touched the old opt-in toggle start with numbers visible
export const damageNumbersEnabled = useLocalStorage<boolean>('pd-show-damage-numbers', true)
