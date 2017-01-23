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

    getNotAuhorizedHeaders: function () {
        const headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        headers.append('Accept-Encoding', 'gzip, deflate');
        return headers;
    },

    getAuhorizedHeaders: function (token) {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        headers.append('Accept-Encoding', 'gzip, deflate');
        return headers;
    },

    Patch: function (url, token, content) {
        let rinit = this.getRequestOptions('PATCH', this.getAuhorizedHeaders(token), content);
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Post: function (url, token, content) {
        let rinit = this.getRequestOptions('POST', token === '' ? this.getNotAuhorizedHeaders() : this.getAuhorizedHeaders(token), content);
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Delete: function (url, token) {
        let rinit = this.getRequestOptions('DELETE', this.getAuhorizedHeaders(token), '');
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    },

    Get: function (url, token) {
        let rinit = this.getRequestOptions('GET', token === '' ? this.getNotAuhorizedHeaders() : this.getAuhorizedHeaders(token), '');
        return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
    }

};
