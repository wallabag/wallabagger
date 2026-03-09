'use strict';

class FetchApi {
    #getRequestOptions (method, token, content) {
        let options = {
            method,
            headers: this.#getHeaders(token),
            mode: 'cors',
            cache: 'default',
            credentials: 'omit'
        };
        if (content !== '') {
            options = Object.assign(options, { body: JSON.stringify(content) });
        }
        return options;
    }

    #getHeaders (token) {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };
        if (token !== '') {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    patch (url, token, content) {
        return this.#fetch(url, 'PATCH', token, content);
    }

    post (url, token, content) {
        return this.#fetch(url, 'POST', token, content);
    }

    delete (url, token) {
        return this.#fetch(url, 'DELETE', token, '');
    }

    get (url, token) {
        return this.#fetch(url, 'GET', token, '');
    }

    #fetch (url, method, token, content) {
        const options = this.#getRequestOptions(method, token, content);
        return fetch(url, options).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    }
};

export { FetchApi };
