import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isSuperSearchOpen = ref(false)

  function openSuperSearch() {
    isSuperSearchOpen.value = true
  }

  function closeSuperSearch() {
    isSuperSearchOpen.value = false
  }

  function toggleSuperSearch() {
    isSuperSearchOpen.value = !isSuperSearchOpen.value
  }

  return {
    isSuperSearchOpen,
    openSuperSearch,
    closeSuperSearch,
    toggleSuperSearch,
  }
})
