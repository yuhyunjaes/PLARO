import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import {ComponentType, ReactElement} from 'react';
import GlobalProvider from "./Providers/GlobalProvider";
import Root from "./Root";
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ============ Reverb 설정 ============
window.Pusher = Pusher;

// app.tsx
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json',
        },
    },
});

// 다크모드
function initializeDarkMode(): void {
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

interface AliasMap {
    [key: string]: string;
}

interface PageProps {
    auth: any;
    [key: string]: any;
}

interface PageModule {
    default: ComponentType<any> & {
        layout?: (page: ReactElement) => ReactElement;
    };
}

createInertiaApp({
    title: (title: string) => `${title} - ${appName}`,
    resolve: async (name: string) => {
        const pages = import.meta.glob<PageModule>('./Pages/**/*.tsx');
        const page = await resolvePageComponent<PageModule>(`./Pages/${name}.tsx`, pages);

        page.default.layout = (pageElement: ReactElement) => {
            const pProps = pageElement.props as PageProps;
            return <Root {...pProps}>{pageElement}</Root>;
        };

        return page;
    },
    setup({ el, App, props }) {
        initializeDarkMode();

        const root = createRoot(el);
        root.render(
            <GlobalProvider>
                <App {...props} />
            </GlobalProvider>
        );
    },
    progress: {
        color: '#ffffff',
    },
});
