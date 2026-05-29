<script setup lang="ts">
  /**
   * Renders a country flag SVG from the country-flag-icons package.
   * Falls back to a coloured square if the flag isn't found.
   */
  // country-flag-icons doesn't export getEmojiFlag directly in all builds
  // We compute emoji flags manually from ISO2 code

  const props = defineProps<{
    iso2: string
    size?: number // px, default 32
    rounded?: boolean
  }>()

  const size = computed(() => props.size ?? 32)

  // country-flag-icons provides SVG URLs via a CDN path pattern
  // We use the emoji flag as a text fallback, and the SVG as the main display
  const svgUrl = computed(() => {
    if (!props.iso2) return null
    // Handle special cases for GB subdivisions
    const code = props.iso2.toUpperCase()
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`
  })

  // Convert ISO2 to emoji flag using regional indicator symbols

  const emoji = computed(() => {
    const code = props.iso2?.toUpperCase() ?? ''
    if (code.length !== 2) return '🏳️'
    try {
      return [...code]
        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('')
    } catch {
      return '🏳️'
    }
  })

  const imgError = ref(false)
</script>

<template>
  <span
    class="inline-flex shrink-0 overflow-hidden"
    :class="rounded ? 'rounded-sm' : 'rounded-xs'"
    :style="{
      width: `${size}px`,
      height: `${Math.round(size * 0.667)}px`,
      border: '1px solid #ffffff2b',
    }"
  >
    <img
      v-if="svgUrl && !imgError"
      :src="svgUrl"
      :alt="iso2"
      class="h-full w-full object-cover"
      @error="imgError = true"
    />

    <span
      v-else
      class="flex h-full w-full items-center justify-center text-xs leading-none"
    >
      {{ emoji }}
    </span>
  </span>
</template>
