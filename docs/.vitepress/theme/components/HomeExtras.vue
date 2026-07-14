<script setup lang="ts">
const paths = [
  {
    icon: '☄️',
    title: 'I use Effector',
    text: 'Add the router to your existing Effector app in a few lines.',
    link: '/introduction/getting-started',
    cta: 'Get started',
  },
  {
    icon: '⚛️',
    title: 'I build for React Native',
    text: 'One routing model for web and native, with ready navigators.',
    link: '/react-native/index',
    cta: 'React Native β',
  },
  {
    icon: '🧩',
    title: 'I want the primitives',
    text: 'Framework-agnostic core: routes, guards, query tracking, groups.',
    link: '/core/index',
    cta: 'Explore the core',
  },
  {
    icon: '💬',
    title: "I'm stuck",
    text: 'Ask the community in the Effector Telegram chat or on GitHub.',
    link: 'https://t.me/effector_ru',
    cta: 'Get help',
  },
];
</script>

<template>
  <section class="home-extra">
    <div class="home-extra__inner">
      <!-- Routes without URLs -->
      <div class="he-split">
        <div class="he-split__text">
          <p class="he-eyebrow">THE CORE IDEA</p>
          <h2 class="he-title">Routes without URLs</h2>
          <p class="he-lead">
            In most routers a route <em>is</em> a URL. Here a route is a unit of
            state and events that may or may not have a path. Modals, wizard
            steps and native screens become first-class routes — and the URL is
            just one adapter you plug in later.
          </p>
          <ul class="he-points">
            <li><strong>No inline URLs.</strong> Features open a route object, not a string. Restructure your URLs in one place.</li>
            <li><strong>Pathless by default.</strong> <code>createRoute()</code> works with no path at all.</li>
            <li><strong>Assign paths centrally</strong> when you register routes in the router.</li>
          </ul>
        </div>
        <div class="he-split__code">
          <pre><code><span class="c">// A modal is a route with no URL</span>
<span class="k">const</span> settingsModal = <span class="f">createRoute</span>()

<span class="c">// A screen is a route with a typed path</span>
<span class="k">const</span> userRoute = <span class="f">createRoute</span>({
  path: <span class="s">'/user/:id'</span>,
}) <span class="c">// Route&lt;{ id: string }&gt;</span>

<span class="c">// URLs live in one place — the router</span>
<span class="k">const</span> router = <span class="f">createRouter</span>({
  routes: [
    userRoute,
    { path: <span class="s">'/settings'</span>, route: settingsModal },
  ],
})</code></pre>
        </div>
      </div>

      <!-- Choose your path -->
      <div class="he-adventure">
        <p class="he-eyebrow he-eyebrow--center">CHOOSE YOUR PATH</p>
        <h2 class="he-title he-title--center">Where do you start?</h2>
        <div class="he-cards">
          <a v-for="p in paths" :key="p.title" class="he-card" :href="p.link">
            <span class="he-card__icon">{{ p.icon }}</span>
            <span class="he-card__title">{{ p.title }}</span>
            <span class="he-card__text">{{ p.text }}</span>
            <span class="he-card__cta">{{ p.cta }} →</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-extra {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 64px;
  padding: 64px 24px 16px;
}

.home-extra__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.he-eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--vp-c-brand-1);
  margin: 0 0 10px;
}

.he-eyebrow--center,
.he-title--center {
  text-align: center;
}

.he-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 18px;
  letter-spacing: -0.02em;
}

.he-lead {
  font-size: 17px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
}

.he-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.he-points li {
  position: relative;
  padding-left: 22px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.he-points li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.he-points code {
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Split layout */
.he-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.he-split__code pre {
  margin: 0;
  padding: 22px;
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.7;
}

.he-split__code .k { color: var(--vp-c-brand-1); }
.he-split__code .f { color: var(--vp-c-brand-2); }
.he-split__code .s { color: var(--vp-c-green-1, #6ccf8e); }
.he-split__code .c { color: var(--vp-c-text-3); font-style: italic; }

/* Adventure cards */
.he-adventure {
  margin-top: 80px;
}

.he-cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.he-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.25s, background 0.25s, transform 0.25s;
}

.he-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-alt);
  transform: translateY(-3px);
}

.he-card__icon {
  font-size: 26px;
  margin-bottom: 14px;
}

.he-card__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.he-card__text {
  font-size: 14px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  flex: 1;
}

.he-card__cta {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

@media (max-width: 960px) {
  .he-split {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .he-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .he-cards {
    grid-template-columns: 1fr;
  }
  .he-title {
    font-size: 26px;
  }
}
</style>
