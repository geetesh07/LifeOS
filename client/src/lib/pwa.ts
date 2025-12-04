// PWA utilities and helpers

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
}

// Show a notification
export async function showNotification(
    title: string,
    options?: NotificationOptions
) {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification (persists even when tab is closed)
        return navigator.serviceWorker.ready.then((registration) => {
            return registration.showNotification(title, {
                icon: '/favicon.png',
                badge: '/favicon.png',
                ...options,
            });
        });
    } else {
        // Fallback to regular notification
        return new Notification(title, {
            icon: '/favicon.png',
            ...options,
        });
    }
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('[PWA] Service worker registered:', registration);

        // Check for updates every hour
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000);

        return registration;
    } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
        return null;
    }
}

// Handle install prompt
let deferredPrompt: any = null;

export function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] Install prompt ready');

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed');
        deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
}

export async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) {
        console.warn('[PWA] Install prompt not available');
        return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);

    deferredPrompt = null;
    return outcome === 'accepted';
}

export function isInstalled(): boolean {
    // Check if running as installed PWA
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
    );
}

// Schedule notification for a specific time
export function scheduleNotification(
    title: string,
    options: NotificationOptions & { scheduledTime: Date }
) {
    const now = new Date().getTime();
    const scheduledTime = options.scheduledTime.getTime();
    const delay = scheduledTime - now;

    if (delay <= 0) {
        // Show immediately if time has passed
        showNotification(title, options);
        return;
    }

    // Schedule for later
    setTimeout(() => {
        showNotification(title, options);
    }, delay);
}
