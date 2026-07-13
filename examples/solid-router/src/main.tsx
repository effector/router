import { render } from 'solid-js/web';
import { Provider } from 'effector-solid';
import { App } from './App';
import { initializeRouter, scope } from './routing/bootstrap';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

await initializeRouter();

render(
  () => (
    <Provider value={scope}>
      <App />
    </Provider>
  ),
  root,
);
