---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: '@effector/router'
  text: 'A route is a unit of logic'
  tagline: 'Type-safe, framework-agnostic routing built on Effector. Model navigation as state and events — then render it with React, React Native, or nothing at all.'
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/effector/router

features:
  - title: Routes without URLs
    icon: 🧭
    details: A route can exist without a path. Modals, wizard steps and native screens are routes too — assign URLs later, in one place.
    link: /core/create-virtual-route
    linkText: createVirtualRoute
  - title: Navigation is state
    icon: ⚡️
    details: Every route exposes $isOpened, $params, opened and closed. Drive it from sample, combine it, and test it without a DOM.
    link: /core/create-route
    linkText: createRoute
  - title: Type-safe params
    icon: <span class="i-logos:typescript-icon"></span>
    details: "'/user/:id' infers Route<{ id: string }>. Wrong or missing params are a compile-time error, not a runtime surprise."
    link: /core/create-route
    linkText: Type safety
  - title: Transition policy & readiness
    icon: 🛡️
    details: beforeNavigate holds history transitions; chainRoute derives post-commit model readiness from ordinary Effector units.
    link: /core/navigation-lifecycle
    linkText: Navigation lifecycle
  - title: SSR by design
    icon: 🗄️
    details: Fork a scope, allSettled the history, serialize. Isomorphism comes from Effector — the same model runs on server and client.
    link: /introduction/getting-started
    linkText: Getting started
  - title: One core, every view layer
    icon: 📱
    details: Framework-agnostic core with bindings for React, Vue, Solid, and React Native. Learn routing once, reuse it everywhere.
    link: /core
    linkText: View core
---
