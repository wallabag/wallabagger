
function getRequestOptions (rmethod, rheaders, content) {
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
};

function getNotAuhorizedHeaders () {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Accept-Encoding', 'gzip, deflate');
    return headers;
};

function getAuhorizedHeaders (token) {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Accept-Encoding', 'gzip, deflate');
    return headers;
};

function Patch (url, token, content) {
    let rinit = this.getRequestOptions('PATCH', this.getAuhorizedHeaders(token), content);
    return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
};

function Post (url, token, content) {
    let rinit = this.getRequestOptions('POST', token === '' ? this.getNotAuhorizedHeaders() : this.getAuhorizedHeaders(token), content);
    return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
};

function Delete (url, token) {
    let rinit = this.getRequestOptions('DELETE', this.getAuhorizedHeaders(token), '');
    return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
};

function Get (url, token) {
    let rinit = this.getRequestOptions('GET', token === '' ? this.getNotAuhorizedHeaders() : this.getAuhorizedHeaders(token), '');
    return fetch(url, rinit).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)));
};
