import { onCleanup, onMount } from 'solid-js';

export default function ReportsPage() {
  onMount(() => {
    document.body.dataset.reportsMounted = 'true';
  });

  onCleanup(() => {
    delete document.body.dataset.reportsMounted;
  });

  return (
    <section data-testid="page-reports">
      <span class="eyebrow">Analytics</span>
      <h2>Reports</h2>
      <p>Lazy route content loaded from a separate module.</p>
    </section>
  );
}
