<script setup lang="ts">
  // ── PickDraw ──────────────────────────────────────────────────────────────
  // Grey "D" icon used in the WtlToggle picker and as the leftover chip when
  // the match ended in a draw. Replaces the old "T" glyph.
</script>

<template>
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M15.6494 0C16.1874 0 16.6488 0.19178 17.0322 0.575195C17.4155 0.958521 17.607 1.41893 17.6064 1.95605V15.6494C17.6064 16.1874 17.415 16.6488 17.0322 17.0322C16.6495 17.4156 16.188 17.6061 15.6494 17.6055H1.95605C1.41833 17.6054 0.957845 17.4148 0.575195 17.0322C0.192432 16.6495 0.000652067 16.188 0 15.6494V1.95605C5.04213e-05 1.41822 0.191866 0.957898 0.575195 0.575195C0.958535 0.192507 1.41889 0.000727135 1.95605 0H15.6494Z"
      fill="oklab(0.5103 0 0)"
    />
    <g filter="url(#pick-draw-shadow)">
      <path
        d="M4.60254 13.2633V4.34259C4.60254 3.9586 4.79453 3.7666 5.17852 3.7666H8.40263C9.88708 3.7666 11.025 4.2021 11.8164 5.0731C12.6078 5.93942 13.0035 7.18271 13.0035 8.80296C13.0035 10.4232 12.6078 11.6688 11.8164 12.5398C11.025 13.4062 9.88708 13.8393 8.40263 13.8393H5.17852C4.79453 13.8393 4.60254 13.6473 4.60254 13.2633ZM6.83624 11.9568H8.40263C9.17061 11.9568 9.75128 11.6876 10.1446 11.149C10.538 10.6105 10.7347 9.82849 10.7347 8.80296C10.7347 7.77742 10.538 6.99774 10.1446 6.4639C9.75128 5.92537 9.17061 5.65611 8.40263 5.65611H6.83624V11.9568Z"
        fill="white"
      />
    </g>
    <defs>
      <filter
        id="pick-draw-shadow"
        x="4.60254"
        y="3.7666"
        width="8.40088"
        height="11.0723"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.022968 0 0 0 0 0.022968 0 0 0 0 0.022968 0 0 0 0.85 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2137_514"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_2137_514"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
</template>
