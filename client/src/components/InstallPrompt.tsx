import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { promptInstall, isInstalled } from '@/lib/pwa';

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        setIsAppInstalled(isInstalled());

        // Listen for install prompt availability
        const handleInstallAvailable = () => {
            if (!isInstalled()) {
                setShowPrompt(true);
            }
        };

        const handleInstalled = () => {
            setIsAppInstalled(true);
            setShowPrompt(false);
        };

        window.addEventListener('pwa-install-available', handleInstallAvailable);
        window.addEventListener('pwa-installed', handleInstalled);

        return () => {
            window.removeEventListener('pwa-install-available', handleInstallAvailable);
            window.removeEventListener('pwa-installed', handleInstalled);
        };
    }, []);

    const handleInstall = async () => {
        const accepted = await promptInstall();
        if (accepted) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Remember dismissal for 7 days
        localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    };

    // Don't show if already installed or dismissed recently
    useEffect(() => {
        const dismissed = localStorage.getItem('install-prompt-dismissed');
        if (dismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                setShowPrompt(false);
            }
        }
    }, []);

    if (!showPrompt || isAppInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
            <Card className="p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">Install LifeFlow</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Install the app for a better experience with offline access and notifications
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleInstall} className="flex-1">
                                Install
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleDismiss}>
                                Later
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </Card>
        </div>
    );
}
