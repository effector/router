<script setup lang="ts"></script>

<template>
  <div class="hero-code">
    <div class="hero-code__chrome">
      <span class="hero-code__dot" />
      <span class="hero-code__dot" />
      <span class="hero-code__dot" />
      <span class="hero-code__file">routing.ts</span>
    </div>
    <pre class="hero-code__body"><code><span class="k">import</span> { createRoute } <span class="k">from</span> <span class="s">'@effector/router'</span>
<span class="k">import</span> { sample } <span class="k">from</span> <span class="s">'effector'</span>

<span class="c">// A route is a unit, not a URL string</span>
<span class="k">const</span> <span class="v">postRoute</span> = <span class="f">createRoute</span>({ path: <span class="s">'/posts/:id'</span> })

<span class="c">// Navigation is an event, fired from your model</span>
<span class="f">sample</span>({
  clock: <span class="v">postCardClicked</span>,
  fn: (post) => ({ params: { id: post.id } }),
  target: <span class="v">postRoute</span>.<span class="f">open</span>,
})

<span class="c">// Data loads before render — in the model</span>
<span class="f">sample</span>({
  clock: <span class="v">postRoute</span>.<span class="v">opened</span>,
  fn: ({ params }) => params.id,
  target: <span class="v">fetchPostFx</span>,
})</code></pre>
  </div>
</template>

<style scoped>
.hero-code {
  width: 100%;
  max-width: 540px;
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
  font-size: 13.5px;
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

@media (max-width: 960px) {
  .hero-code {
    max-width: 100%;
    margin-top: 24px;
  }
}
</style>
