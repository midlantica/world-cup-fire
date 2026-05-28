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
        {{ tz.code }}
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
    gap: 5px;
    padding: 6px 12px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(
      180deg,
      rgba(62, 58, 54, 1) 0%,
      rgba(40, 35, 34, 1) 100%
    );
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    color: #f3f3f3;
  }

  .tz-picker-btn:hover {
    background: linear-gradient(
      180deg,
      rgba(72, 68, 64, 1) 0%,
      rgba(50, 45, 44, 1) 100%
    );
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
    overflow: hidden;
    min-width: 5rem;
  }

  .tz-option {
    display: block;
    width: 100%;
    text-align: center;
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
