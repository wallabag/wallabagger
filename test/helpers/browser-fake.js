import { vi } from 'vitest';

export function fakeBrowser() {
    const messageListeners = [];
    return {
        runtime: {
            onMessage: {
                addListener: (fn) => messageListeners.push(fn),
                removeListener: (fn) => {
                    const i = messageListeners.indexOf(fn);
                    if (i !== -1) messageListeners.splice(i, 1);
                },
            },
            getManifest: () => ({ version: '1.0.0' }),
        },
        scripting: {
            executeScript: vi.fn(),
        },
        _messageListeners: messageListeners,
        _fireOnMessage(event, sender) {
            // Copy the array since listeners may remove themselves
            [...messageListeners].forEach(fn => fn(event, sender));
        },
    };
}

export function fakeLogger() {
    return {
        log: vi.fn(),
        groupCollapsed: vi.fn(),
        groupEnd: vi.fn(),
    };
}

export function fakeBrowserUtils({ isRestrictedPage = false } = {}) {
    return {
        isRestrictedPage: vi.fn().mockReturnValue(isRestrictedPage),
        isServicePage: vi.fn().mockReturnValue(false),
        getActiveTab: vi.fn(),
    };
}

export function fakeApi({ isSiteToFetchLocally = true } = {}) {
    return {
        isSiteToFetchLocally: vi.fn().mockReturnValue(isSiteToFetchLocally),
    };
}
