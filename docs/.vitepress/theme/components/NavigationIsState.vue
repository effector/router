<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

type Route = {
  id: string;
  label: string;
  path: string;
  pathless?: boolean;
  param?: string;
};

const routes: Route[] = [
  { id: 'feed', label: 'feedRoute', path: '/' },
  { id: 'post', label: 'postRoute', path: '/posts/:id', param: 'id' },
  { id: 'profile', label: 'profileRoute', path: '/profile' },
  { id: 'settings', label: 'settingsModal', path: '/settings', pathless: true },
];

const pathInput = ref('/');
const currentPath = ref('/');
const activeId = ref<string | null>(null);
const params = ref<Record<string, string>>({});
const idValue = ref('42');
const log = ref<{ type: 'opened' | 'closed'; label: string }[]>([]);

function toRegex(path: string) {
  const names: string[] = [];
  const source = path
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)/g, (_m, name) => {
      names.push(name);
      return '([^/]+)';
    });
  return { re: new RegExp(`^${source}$`), names };
}

function match(path: string) {
  for (const route of routes) {
    const { re, names } = toRegex(route.path);
    const m = re.exec(path);
    if (m) {
      const p: Record<string, string> = {};
      names.forEach((n, i) => (p[n] = m[i + 1]));
      return { route, params: p };
    }
  }
  return null;
}

function commit(path: string, source: 'url' | 'route') {
  const found = match(path);
  const prev = activeId.value;
  const prevRoute = routes.find((r) => r.id === prev);

  if (!found) {
    if (prevRoute) push('closed', prevRoute.label);
    activeId.value = null;
    params.value = {};
    currentPath.value = path;
    pathInput.value = path;
    return;
  }

  if (prev && prev !== found.route.id && prevRoute) push('closed', prevRoute.label);
  if (prev !== found.route.id) push('opened', found.route.label);

  activeId.value = found.route.id;
  params.value = found.params;
  currentPath.value = path;
  pathInput.value = path;
  if (found.route.param && found.params[found.route.param]) {
    idValue.value = found.params[found.route.param];
  }
}

function push(type: 'opened' | 'closed', label: string) {
  log.value = [{ type, label }, ...log.value].slice(0, 5);
}

function openRoute(route: Route) {
  const path = route.param
    ? route.path.replace(`:${route.param}`, idValue.value || '1')
    : route.path;
  commit(path, 'route');
}

function submitUrl() {
  const value = pathInput.value.trim() || '/';
  commit(value.startsWith('/') ? value : `/${value}`, 'url');
}

const isOpened = (id: string) => activeId.value === id;
const paramsJson = computed(() =>
  Object.keys(params.value).length
    ? JSON.stringify(params.value)
    : '{}',
);
const activeLabel = computed(
  () => routes.find((r) => r.id === activeId.value)?.label ?? 'none',
);

onMounted(() => commit('/', 'route'));
</script>

<template>
  <section class="nis">
    <div class="nis__inner">
      <p class="nis__eyebrow">NAVIGATION IS STATE</p>
      <h2 class="nis__title">Watch the model move</h2>
      <p class="nis__lead">
        Every route is an Effector unit. Change the URL or open a route — the
        graph and every store update in lockstep. This is state you can observe,
        combine and test, not a side effect of rendering.
      </p>

      <div class="nis__stage">
        <div class="nis__url">
          <span class="nis__url-tag">router.$path</span>
          <input
            class="nis__url-input"
            v-model="pathInput"
            spellcheck="false"
            aria-label="Current URL path"
            @keydown.enter="submitUrl"
          />
          <button class="nis__url-go" @click="submitUrl">Navigate</button>
        </div>

        <div class="nis__panels">
          <div class="nis__graph">
            <p class="nis__panel-label">routes</p>
            <button
              v-for="route in routes"
              :key="route.id"
              class="nis__node"
              :class="{ 'nis__node--active': isOpened(route.id) }"
              @click="openRoute(route)"
            >
              <span class="nis__node-dot" />
              <span class="nis__node-body">
                <span class="nis__node-name">{{ route.label }}</span>
                <span class="nis__node-path">
                  {{ route.pathless ? 'pathless → ' + route.path : route.path }}
                </span>
              </span>
              <span v-if="isOpened(route.id)" class="nis__node-flag">opened</span>
            </button>

            <label v-if="isOpened('post')" class="nis__param">
              <span>:id</span>
              <input
                class="nis__param-input"
                v-model="idValue"
                spellcheck="false"
                @keydown.enter="openRoute(routes[1])"
                @input="openRoute(routes[1])"
              />
            </label>
          </div>

          <div class="nis__stores">
            <p class="nis__panel-label">stores</p>
            <div class="nis__store-row">
              <code>router.$path</code>
              <code class="nis__store-val">{{ currentPath }}</code>
            </div>
            <div
              v-for="route in routes"
              :key="route.id"
              class="nis__store-row"
            >
              <code>{{ route.label }}.$isOpened</code>
              <code
                class="nis__store-val"
                :class="isOpened(route.id) ? 'is-true' : 'is-false'"
              >{{ isOpened(route.id) }}</code>
            </div>
            <div class="nis__store-row">
              <code>{{ activeLabel }}.$params</code>
              <code class="nis__store-val">{{ paramsJson }}</code>
            </div>
          </div>
        </div>

        <div class="nis__log">
          <p class="nis__panel-label">events</p>
          <p v-if="!log.length" class="nis__log-empty">
            open a route to fire opened / closed
          </p>
          <ul v-else class="nis__log-list">
            <li v-for="(entry, i) in log" :key="i" class="nis__log-item">
              <span
                class="nis__log-type"
                :class="entry.type === 'opened' ? 'is-open' : 'is-close'"
              >{{ entry.type }}</span>
              <code>{{ entry.label }}</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nis {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 64px;
  padding: 64px 24px 8px;
}

.nis__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.nis__eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--vp-c-brand-1);
  margin: 0 0 10px;
  text-align: center;
}

.nis__title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 18px;
  text-align: center;
}

.nis__lead {
  font-size: 17px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 auto 36px;
  max-width: 640px;
  text-align: center;
}

.nis__stage {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-alt);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* URL bar */
.nis__url {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 8px 10px;
}

.nis__url-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.nis__url-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.nis__url-go {
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--vp-c-brand-3);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.nis__url-go:hover {
  background: var(--vp-c-brand-2);
}

/* Panels */
.nis__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.nis__panel-label {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin: 0 0 12px;
}

.nis__graph,
.nis__stores,
.nis__log {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px;
}

/* Nodes */
.nis__node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.nis__node:last-of-type {
  margin-bottom: 0;
}

.nis__node:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateX(2px);
}

.nis__node--active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.nis__node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-gray-3);
  flex-shrink: 0;
  transition: background 0.2s;
}

.nis__node--active .nis__node-dot {
  background: var(--vp-c-brand-1);
}

.nis__node-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.nis__node-name {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.nis__node-path {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.nis__node-flag {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.nis__param {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px dashed var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.nis__param-input {
  flex: 1;
  min-width: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
  outline: none;
}

/* Stores */
.nis__store-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.nis__store-row:last-child {
  border-bottom: none;
}

.nis__store-row code {
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.nis__store-val {
  color: var(--vp-c-text-1) !important;
}

.nis__store-val.is-true {
  color: var(--vp-c-brand-1) !important;
  font-weight: 600;
}

.nis__store-val.is-false {
  color: var(--vp-c-text-3) !important;
}

/* Log */
.nis__log-empty {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin: 0;
  font-style: italic;
}

.nis__log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nis__log-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 4px 12px;
}

.nis__log-item code {
  background: transparent;
  padding: 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.nis__log-type {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
}

.nis__log-type.is-open {
  color: var(--vp-c-brand-1);
}

.nis__log-type.is-close {
  color: var(--vp-c-text-3);
}

@media (max-width: 760px) {
  .nis__panels {
    grid-template-columns: 1fr;
  }
  .nis__title {
    font-size: 26px;
  }
}
</style>
