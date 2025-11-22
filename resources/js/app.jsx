import CalenoteLayout from './Layouts/CalenoteLayout.jsx';
import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// 다크모드
function initializeDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (prefersDark.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    prefersDark.addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}

// 이동
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const aliasMap = {
            LifeBot: 'LifeBot/LifeBot',
        };

        const normalizedName = aliasMap[name] ?? name;

        const pages = import.meta.glob('./Pages/**/*.jsx');
        const page = await resolvePageComponent(
            `./Pages/${normalizedName}.jsx`,
            pages,
        );

        if (normalizedName.startsWith('Calenote/')) {
            page.default.layout = (pageProps) => (
                <CalenoteLayout {...pageProps.props}>
                    {pageProps}
                </CalenoteLayout>
            );
        } else {
            page.default.layout = (pageProps) => <>{pageProps}</>;
        }

        return page;
    },
    setup({ el, App, props }) {
        initializeDarkMode();

        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#ffffff',
    },
});
