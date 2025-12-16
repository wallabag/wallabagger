'use strict';

class Cache {
    #cache = null;
    #enabled = false;

    constructor (enable) {
        this.#enabled = enable;
        this.#cache = [];
    }

    set (key, data) {
        if (this.#enabled) {
            this.#cache[this.#str(key)] = data;
        }
    }

    clear (key) {
        if (this.#enabled) {
            delete this.#cache[this.#str(key)];
        }
    }

    check (key) {
        return this.#enabled && (this.#cache[this.#str(key)] !== undefined);
    }

    get (key) {
        return this.#enabled ? this.#cache[this.#str(key)] : undefined;
    }

    #str (some) {
        return btoa(some);
    }
}

export { Cache };
