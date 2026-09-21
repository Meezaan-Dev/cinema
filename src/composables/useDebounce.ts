import { ref, watch, type Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay = 350): Ref<T> {
  const debounced = ref(value.value) as Ref<T>

  watch(
    value,
    (next, _, onCleanup) => {
      const timer = window.setTimeout(() => {
        debounced.value = next
      }, delay)
      onCleanup(() => window.clearTimeout(timer))
    },
    { immediate: true },
  )

  return debounced
}
