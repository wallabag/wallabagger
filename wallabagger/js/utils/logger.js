'use strict';

class Logger {
    #name = 'default';
    #enabled = false;

    constructor (name) {
        this.#name = name;
    }

    error (message, content, ...args) {
        if (this.#enabled === false) {
            return;
        }
        console.error(`[${this.#name}]`, message, this.#obfuscateSensitiveData(content), ...args);
        this.trace();
    }

    groupCollapsed (label) {
        if (this.#enabled === false) {
            return;
        }
        console.groupCollapsed(label);
    }

    groupEnd () {
        if (this.#enabled === false) {
            return;
        }
        console.groupEnd();
    }

    log (message, content, ...args) {
        if (this.#enabled === false) {
            return;
        }
        console.log(`[${this.#name}]`, message, this.#obfuscateSensitiveData(content), ...args);
        this.trace();
    }

    setDebug (state) {
        this.#enabled = state;
    }

    trace () {
        if (this.#enabled === false) {
            return;
        }
        this.groupCollapsed('trace');
        console.trace();
        this.groupEnd();
    }

    warn (message, content, ...args) {
        if (this.#enabled === false) {
            return;
        }
        console.warn(`[${this.#name}]`, message, this.#obfuscateSensitiveData(content), ...args);
        this.trace();
    }

    #obfuscateSensitiveData (obj) {
        if (typeof obj !== 'object') {
            return obj;
        }

        let clonedObj = JSON.parse(JSON.stringify(obj));
        const obfuscate = data => {
            // @TODO those fields should be retrieved from the wallabag-api file when migrated to a class
            ['ApiToken', 'ClientId', 'ClientSecret', 'RefreshToken', 'Url', 'UserLogin', 'UserPassword'].map(forbiddenProperty => {
                if (Object.hasOwn(data, forbiddenProperty)) {
                    data[forbiddenProperty] = '===obfuscated===';
                    return true;
                }
                return false;
            });
            return data;
        };
        clonedObj = obfuscate(clonedObj);
        // It's ugly but right now, the object can be nested inside a post message
        if (clonedObj.data) {
            clonedObj.data = obfuscate(clonedObj.data);
        }
        return clonedObj;
    }
}

export { Logger };
