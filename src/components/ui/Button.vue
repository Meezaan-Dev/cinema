<script setup lang="ts">
import { computed } from 'vue'
import type { VariantProps } from 'class-variance-authority'

import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariantProps['variant']
    size?: ButtonVariantProps['size']
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
  }>(),
  {
    type: 'button',
    variant: 'secondary',
    size: 'md',
  },
)

const classes = computed(() => cn(buttonVariants({ variant: props.variant, size: props.size, className: props.class })))
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
