<script setup lang="ts"></script>

<template>
  <div class="hero-code">
    <div class="hero-code__chrome">
      <span class="hero-code__dot" />
      <span class="hero-code__dot" />
      <span class="hero-code__dot" />
      <span class="hero-code__file">page.model.ts</span>
    </div>
    <pre class="hero-code__body"><code><span class="k">import</span> { beforeNavigate, chainRoute } <span class="k">from</span> <span class="s">'@effector/router'</span>
<span class="k">import</span> { sample } <span class="k">from</span> <span class="s">'effector'</span>

<span class="c">// Hold navigation until the guard resolves</span>
<span class="k">const</span> <span class="v">guard</span> = <span class="f">beforeNavigate</span>({
  controls,
  to: <span class="v">dashboardRoute</span>,
  filter: <span class="v">$unauthorized</span>,
})

<span class="f">sample</span>({
  clock: <span class="v">guard</span>.<span class="v">started</span>,
  target: <span class="f">redirect</span>({ to: <span class="v">loginRoute</span> }),
})

<span class="c">// Open the route only after data is ready</span>
<span class="k">const</span> <span class="v">readyDashboard</span> = <span class="f">chainRoute</span>({
  route: <span class="v">dashboardRoute</span>,
  beforeOpen: <span class="v">loadDashboardFx</span>,
})</code></pre>
  </div>
</template>

<style scoped>
.hero-code {
  width: 100%;
  max-width: 480px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  box-shadow: 0 18px 50px -18px rgba(0, 0, 0, 0.5);
  text-align: left;
}

.hero-code__chrome {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.hero-code__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--vp-c-gray-3);
}

.hero-code__file {
  margin-left: 8px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
}

.hero-code__body {
  margin: 0;
  padding: 18px 20px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.65;
  color: var(--vp-c-text-1);
}

.hero-code__body code {
  background: transparent;
  padding: 0;
  font-family: inherit;
}

.hero-code .k { color: var(--vp-c-brand-1); }
.hero-code .f { color: var(--vp-c-brand-2); }
.hero-code .s { color: var(--vp-c-green-1, #6ccf8e); }
.hero-code .c { color: var(--vp-c-text-3); font-style: italic; }
.hero-code .v { color: var(--vp-c-text-1); }

@media (max-width: 1279px) {
  .hero-code {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (max-width: 960px) {
  .hero-code {
    max-width: 100%;
    margin-top: 24px;
  }
}
</style>
