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

  // Flags not on the purecatamphetamine CDN — served locally from /public/flags/
  const LOCAL_FLAGS = new Set(['CW', 'GB-ENG', 'GB-SCT', 'GB-WLS'])

  // Primary CDN: purecatamphetamine (most flags)
  // Fallback CDN: Iconify (any remaining gaps)
  const svgUrl = computed(() => {
    if (!props.iso2) return null
    const code = props.iso2.toUpperCase()
    if (LOCAL_FLAGS.has(code)) return `/flags/${code}.svg`
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`
  })

  const fallbackUrl = computed(() => {
    if (!props.iso2) return null
    const code = props.iso2.toLowerCase()
    return `https://api.iconify.design/flag:${code}-4x3.svg`
  })

  const useFallback = ref(false)

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
  watch(svgUrl, () => {
    useFallback.value = false
    imgError.value = false
  })
</script>

<template>
  <span
    class="inline-flex shrink-0 overflow-hidden"
    :class="rounded ? 'rounded-sm' : 'rounded-xs'"
    :style="{
      width: `${size}px`,
      height: `${Math.round(size * 0.667)}px`,
      border: '1px solid #ffffff2b',
      position: 'relative',
      top: '-1px',
    }"
  >
    <!-- Primary: purecatamphetamine CDN -->
    <img
      v-if="svgUrl && !useFallback && !imgError"
      :key="svgUrl"
      :src="svgUrl"
      :alt="iso2"
      class="h-full w-full object-cover"
      @error="useFallback = true"
    />

    <!-- Secondary: Iconify CDN (has CW, GB-SCT, GB-ENG, GB-WLS, etc.) -->
    <img
      v-else-if="fallbackUrl && useFallback && !imgError"
      :key="fallbackUrl"
      :src="fallbackUrl"
      :alt="iso2"
      class="h-full w-full object-cover"
      @error="imgError = true"
    />

    <!-- Final: emoji fallback -->
    <span
      v-else
      class="flex h-full w-full items-center justify-center text-xs leading-none"
    >
      {{ emoji }}
    </span>
  </span>
</template>
