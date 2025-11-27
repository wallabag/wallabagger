import { defineConfig } from "eslint/config";
import promise from "eslint-plugin-promise";
import compat from "eslint-plugin-compat";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
    { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
    {
        plugins: {
            promise,
            compat,
        },

        languageOptions: {
            globals: {
                ...globals.webextensions,
                ...globals.browser,
                WallabagApi: true,
                FetchApi: true,
                Common: true,
            },
        },

        settings: {
            polyfills: ["TextEncoder"],
        },

        rules: {
            indent: ["error", 4, {
                SwitchCase: 1,
            }],

            "compat/compat": "error",
            "eol-last": 0,
            "linebreak-style": ["error", "unix"],
            semi: ["error", "always"],
            "no-console": 1,

            "no-global-assign": ["error", {
                exceptions: ["browser"],
            }],

            "no-native-reassign": ["error", {
                exceptions: ["browser"],
            }],
        },
    }]);
