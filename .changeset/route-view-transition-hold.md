---
'@effector/router-react': patch
'@effector/router-vue': patch
'@effector/router-solid': patch
---

Hold the previously resolved view while a route in the list is still pending, closing the gap between the previous route closing and the next one opening.

Closing the previous route and opening the next one is not atomic, so for one instant nothing in a `createRoutesView`/`Outlet`'s list is opened. Without this, that instant fell through to `closed`/`otherwise` — flashing the not-found screen and tearing down any `withLayout` group around it — on every ordinary navigation, not just ones with a declared `loading`. The hold applies only while something is pending; an unmatched URL still shows `otherwise` immediately.

In the Solid binding this closes most, but not all, of the gap: its fine-grained reactivity can still observe the previous route closing and the next one becoming pending as two separate ticks (React and Vue's schedulers coalesce them), occasionally costing one extra layout remount recovering from a transient `otherwise` frame. Navigation still converges on the right page. See the `closed`/`loading` resolution order in the `createRouteView` reference for details.
