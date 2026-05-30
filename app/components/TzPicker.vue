<script setup lang="ts">
  import { useTimezone, TZ_OPTIONS } from '~/composables/useTimezone'

  const { selectedTz, setTz } = useTimezone()

  const open = ref(false)
  const wrapRef = ref<HTMLElement | null>(null)

  function choose(code: (typeof TZ_OPTIONS)[number]['code']) {
    setTz(code)
    open.value = false
  }

  onMounted(() => {
    document.addEventListener('click', (e) => {
      if (
        open.value &&
        wrapRef.value &&
        !wrapRef.value.contains(e.target as Node)
      ) {
        open.value = false
      }
    })
  })
</script>

<template>
  <div ref="wrapRef" class="tz-picker-wrap">
    <button
      class="tz-picker-btn"
      aria-label="Select time zone"
      @click.stop="open = !open"
    >
      <span class="tz-picker-label">TZ: {{ selectedTz }}</span>
      <span class="tz-picker-caret">▼</span>
    </button>
    <div v-if="open" class="tz-dropdown">
      <button
        v-for="tz in TZ_OPTIONS"
        :key="tz.code"
        class="tz-option"
        :class="{ selected: selectedTz === tz.code }"
        @click="choose(tz.code)"
      >
        <span class="tz-option-code">{{ tz.code }}</span>
        <span class="tz-option-label">{{ tz.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .tz-picker-wrap {
    position: relative;
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }

  /* Single unified pill button — matches My Nation button style */
  .tz-picker-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    background: hsl(0deg 0% 100% / 10%);

    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    color: #f3f3f3;
  }

  .tz-picker-btn:hover {
    background: hsl(0deg 0% 100% / 16%);
    color: #ffffff;
  }

  .tz-picker-label {
    font-family: 'Anybody', sans-serif;
    font-weight: 500;
    font-size: 1.009rem;
    line-height: 22.54px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .tz-picker-caret {
    font-size: 0.5rem;
    opacity: 0.7;
    margin-left: 0.1rem;
  }

  .tz-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    z-index: 200;
    background: #1a1817;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
    max-height: 18rem;
    min-width: 13rem;
  }

  .tz-option {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    width: 100%;
    text-align: left;
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
    white-space: nowrap;
  }

  .tz-option-code {
    flex-shrink: 0;
    min-width: 2.5rem;
    font-weight: 700;
  }

  .tz-option-label {
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
  }

  .tz-option:hover .tz-option-label,
  .tz-option.selected .tz-option-label {
    color: rgba(255, 255, 255, 0.8);
  }

  .tz-option + .tz-option {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .tz-option:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .tz-option.selected {
    color: #f3f3f3;
    background: rgba(255, 255, 255, 0.12);
  }
</style>
