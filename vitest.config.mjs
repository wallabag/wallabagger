import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['test/unit/**/*.test.js'],
        environment: 'happy-dom',
    },
});
