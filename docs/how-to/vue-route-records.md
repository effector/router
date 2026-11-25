---
title: Route records in Vue
---

# Route records in Vue

A route record is one object `{ route, view }`: a route and the page that
renders it. Each page folder exports its record, and the application collects
the records into one routes view. A new page then needs no edit outside its
folder.

```
src/
  shared/routing.ts              routes, router, history
  pages/
    home/
      page.ts                    the page component
      index.route-record.ts      { route, view }
    post/
      model.ts                   page logic, chainRoute
      page.ts
      index.route-record.ts
  app/
    routes-view.ts               collects the records
    main.ts                      starts the application
```

Every code block on this page is a file of
`docs/snippets/how-to/vue-route-records` in the repository and is type-checked
by `pnpm :docs typecheck`. The pages are written as render functions for that
check. A page can be a single-file component as well.

## 1. Routes, router and history

The history is attached in the model: `appStarted` gives the router a browser
history.

`src/shared/routing.ts`

<<< @/snippets/how-to/vue-route-records/shared/routing.ts

## 2. A record

A record is a [`RouteView`](/vue/create-route-view): the value that
`createRouteView` and `createLazyRouteView` return has the same shape.

`src/pages/home/page.ts`

<<< @/snippets/how-to/vue-route-records/pages/home/page.ts

`src/pages/home/index.route-record.ts`

<<< @/snippets/how-to/vue-route-records/pages/home/index.route-record.ts

## 3. Page logic with a chained route

The logic of a page lives in its `model.ts`.
[`chainRoute`](/core/chain-route) gives a second route that opens after the
data of the page is loaded.

`src/pages/post/model.ts`

<<< @/snippets/how-to/vue-route-records/pages/post/model.ts

The record binds the page to the path route, so the page mounts as soon as the
URL matches. The page reads the chained route with
[`useIsOpened`](/vue/use-is-opened) and shows a skeleton until it opens.

`src/pages/post/page.ts`

<<< @/snippets/how-to/vue-route-records/pages/post/page.ts

`src/pages/post/index.route-record.ts`

<<< @/snippets/how-to/vue-route-records/pages/post/index.route-record.ts

## 4. Collect the records

`import.meta.glob` of Vite finds every record file. With `eager: true` the
records are part of the main bundle.

`src/app/routes-view.ts`

<<< @/snippets/how-to/vue-route-records/app/routes-view.ts

When several routes are opened, the routes view renders the last record of the
list. `import.meta.glob` orders the records by file path. See
[`createRoutesView`](/vue/create-routes-view) for the selection rules.

## 5. Start the application

`src/app/main.ts`

<<< @/snippets/how-to/vue-route-records/app/main.ts
