<script setup lang="ts"></script>

<template>
  <div class="hero-triad">
    <span class="hero-triad__chip">Type-safe</span>
    <span class="hero-triad__sep">·</span>
    <span class="hero-triad__chip">Framework-agnostic</span>
    <span class="hero-triad__sep">·</span>
    <span class="hero-triad__chip">Observable</span>
  </div>
</template>

<style scoped>
.hero-triad {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  letter-spacing: 0.01em;
}

.hero-triad__chip {
  color: var(--vp-c-text-2);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.hero-triad__sep {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

@media (max-width: 1279px) {
  .hero-triad {
    justify-content: center;
  }
}
</style>
