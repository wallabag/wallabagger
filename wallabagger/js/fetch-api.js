var FetchApi = function () {};

FetchApi.prototype = {

    getRequestOptions: function (rmethod, rheaders, content) {
        let options = {
            method: rmethod,
            headers: rheaders,
            mode: 'cors',
            cache: 'default'
        };

        if ((content !== '') && (content != null)) {
            options.body = content;
        };

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
        let rinit = this.getRequestOptions('PATCH', this.getHeaders(token), content);
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Post: function (url, token, content) {
        let rinit = this.getRequestOptions('POST', this.getHeaders(token), content);
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Delete: function (url, token) {
        let rinit = this.getRequestOptions('DELETE', this.getHeaders(token), '');
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Get: function (url, token) {
        return this.Fetch(url, this.getRequestOptions('GET', this.getHeaders(token), ''));
    },

    isEdge: function () {
        return true;
    },

    Fetch: function (url, token) {
        return this.isEdge ? this.xhrFetch(url, token) : this.apiFetchurl(url, token);
    },

    apiFetch: (url, init) => fetch(url, init).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err))),

    xhrFetch: function (url, options) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
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
