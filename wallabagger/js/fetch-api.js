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

    Patch (url, token, content) {
        return this.#Fetch(url, 'PATCH', token, content);
    }

    Post (url, token, content) {
        return this.#Fetch(url, 'POST', token, content);
    }

    Delete (url, token) {
        return this.#Fetch(url, 'DELETE', token, '');
    }

    Get (url, token) {
        return this.#Fetch(url, 'GET', token, '');
    }

    #Fetch (url, method, token, content) {
        const options = this.#getRequestOptions(method, token, content);
        return fetch(url, options).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    }
};

export { FetchApi };
