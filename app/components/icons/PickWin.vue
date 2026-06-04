<script setup lang="ts">
  // ── PickWin ───────────────────────────────────────────────────────────────
  // Green "W" icon used in the WtlToggle picker and as the leftover chip when
  // this row's team won. Replaces the old checkmark glyph.
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
      fill="#009F13"
    />
    <g filter="url(#pick-win-shadow)">
      <path
        d="M2.40088 4.11759C2.40088 3.8694 2.69824 3.74296 3.29295 3.73828H3.66524C4.24122 3.73828 4.56199 3.88813 4.62755 4.18783L5.70928 8.81678C5.72801 8.88234 5.87552 9.57306 6.15181 10.8889C6.208 10.5049 6.3719 9.81422 6.6435 8.81678L7.82357 4.04032C7.87039 3.83896 8.13497 3.73828 8.6173 3.73828H9.15817C9.63581 3.73828 9.90039 3.83896 9.9519 4.04032L11.0898 8.81678C11.2537 9.5192 11.4153 10.2427 11.5745 10.9873C11.6401 10.711 11.729 10.3223 11.8414 9.82124C11.9538 9.3155 12.0287 8.98068 12.0662 8.81678L13.1901 4.18783C13.2556 3.89281 13.5764 3.74296 14.1524 3.73828H14.3139C14.9086 3.73828 15.206 3.86472 15.206 4.11759C15.206 4.14569 15.1943 4.21593 15.1709 4.32831L12.8318 13.5651C12.7756 13.7665 12.5111 13.8672 12.0381 13.8672H10.9845C10.4974 13.8672 10.2352 13.7665 10.1977 13.5651L8.78588 7.60862L7.31782 13.5651C7.26163 13.7665 6.99939 13.8672 6.53111 13.8672H5.49153C4.99984 13.8672 4.73526 13.7665 4.69779 13.5651L2.42898 4.32831C2.41024 4.27212 2.40088 4.20188 2.40088 4.11759Z"
        fill="white"
      />
    </g>
    <defs>
      <filter
        id="pick-win-shadow"
        x="2.40088"
        y="3.73828"
        width="12.8052"
        height="11.1289"
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
          result="effect1_dropShadow_2137_510"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_2137_510"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
</template>
