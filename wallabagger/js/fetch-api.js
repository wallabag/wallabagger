var FetchApi = function () {};

FetchApi.prototype = {

    getRequestOptions: function (method, token, content) {
        let options = {
            method: method,
            headers: this.getHeaders(token),
            mode: 'cors',
            cache: 'default',
            credentials: 'omit'
        };
        if (content !== '') {
            options = Object.assign(options, { body: JSON.stringify(content) });
        }
        return options;
    },

    getHeaders: function (token) {
        const headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        if (token !== '') {
            headers.append('Authorization', `Bearer ${token}`);
        }
        return headers;
    },

    Patch: function (url, token, content) {
        return this.Fetch(url, 'PATCH', token, content);
    },

    Post: function (url, token, content) {
        return this.Fetch(url, 'POST', token, content);
    },

    Delete: function (url, token) {
        return this.Fetch(url, 'DELETE', token, '');
    },

    Get: function (url, token) {
        return this.Fetch(url, 'GET', token, '');
    },

    isEdge: function () {
        return /Edge/.test(navigator.userAgent);
    },

    Fetch: function (url, method, token, content) {
        const options = this.getRequestOptions(method, token, content);
        return this.isEdge()
            ? this.xhrFetch(url, options)
            : this.apiFetch(url, options);
    },

    apiFetch: (url, options) => fetch(url, options).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err))),

    xhrFetch: function (url, options) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            // checks if CORS available
            if ('withCredentials' in xhr) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 400) {
                            resolve(JSON.parse(xhr.responseText)); // load();
                        } else {
                            reject(new Error(
                                `XHR error ${xhr.status || ''} ${xhr.statusText || ''} loading ${url} 
                                ----
                                ${xhr.responseText}
                                ----`)); // error();
                        }
                    }
                };
                xhr.open(options.method, url, true);
                for (const key of options.headers.keys()) {
                    xhr.setRequestHeader(key, options.headers.get(key));
                }
                xhr.send(options.body);
            } else {
                reject(new Error('Browser doesn\'t suppotr CORS requests!'));
            }
        });
    }

};
