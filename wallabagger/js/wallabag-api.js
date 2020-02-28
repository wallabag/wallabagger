var WallabagApi = function () { };

WallabagApi.prototype = {

    defaultValues: {
        Url: null,
        ApiVersion: null,
        ClientId: null,
        ClientSecret: null,
        UserLogin: null,
        UserPassword: null,
        ApiToken: null,
        RefreshToken: null,
        ExpireDate: 0,
        isTokenExpired: true,
        isFetchPermissionGranted: null,
        AllowSpaceInTags: false,
        AllowExistCheck: false,
        Debug: false
    },

    data: {},

    fetchApi: null,

    tags: [],

    init: function () {
        Object.assign(this.data, this.defaultValues);
        this.fetchApi = new FetchApi();
        return this.load().then(
            result => Promise.resolve(result)
        );
    },

    resetDebug: function () {
        this.data.Debug = this.defaultValues.Debug;
        this.save();
    },

    save: function () {
        browser.storage.local.set({ wallabagdata: this.data });
    },

    load: function () {
        return new Promise((resolve, reject) => {
            browser.storage.local.get('wallabagdata', result => {
                if (result.wallabagdata != null) {
                    this.set(result.wallabagdata);
                    if (this.checkParams()) {
                        resolve(this.data);
                    } else {
                        this.clear();
                        if (this.Debug === true) {
                            console.log('Some parameters are empty. Check the settings');
                        }
                    }
                } else {
                    this.clear();
                    if (this.Debug === true) {
                        console.log('Saved parameters not found. Check the settings');
                    }
                }
            });
        });
    },

    needNewAppToken: function () {
        const need = (
            (this.data.ApiToken === '') ||
                  (this.data.ApiToken === null) ||
                  this.isTokenExpired()
        );
        return need;
    },

    checkParams: function () {
        return ((this.data.ClientId !== null) &&
                 (this.data.ClientSecret !== null) &&
                 (this.data.userLogin !== null) &&
                 (this.data.UserPassword !== null) &&
                 (this.data.ClientId !== '') &&
                 (this.data.ClientSecret !== '') &&
                 (this.data.userLogin !== '') &&
                 (this.data.UserPassword !== ''));
    },

    isTokenExpired: function () {
        return Date.now() > this.data.ExpireDate;
    },

    clear: function () {
        this.set(this.defaultValues);
    },

    set: function (params) {
        Object.assign(this.data, params);
    },

    setsave: function (params) {
        this.set(params);
        this.save();
    },

    CheckUrl: function () {
        const url_ = this.data.Url + '/api/version';
        return this.fetchApi.Get(url_, '')
            .then(fetchData => { this.data.ApiVersion = fetchData; return fetchData; })
            .catch(error => {
                throw new Error(`Failed to get api version ${url_}
                ${error.message}`);
            });
    },

    SaveTitle: function (articleId, articleTitle) {
        return this.PatchArticle(articleId, { title: articleTitle });
    },

    SaveStarred: function (articleId, articleStarred) {
        return this.PatchArticle(articleId, { starred: articleStarred });
    },

    SaveArchived: function (articleId, articleArchived) {
        return this.PatchArticle(articleId, { archive: articleArchived });
    },

    SaveTags: function (articleId, taglist) {
        return this.PatchArticle(articleId, { tags: taglist });
    },

    PatchArticle: function (articleId, content) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Patch(entryUrl, this.data.ApiToken, content)
        )
            .catch(error => {
                throw new Error(`Failed to update article ${entryUrl}
                ${error.message}`);
            });
    },
    /** Delete article
     * @param articleId {number} Article identificator
     */
    DeleteArticle: function (articleId) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Delete(entryUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to delete article ${entryUrl}
                ${error.message}`);
            });
    },

    DeleteArticleTag: function (articleId, tagid) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}/tags/${tagid}.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Delete(entryUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to delete article tag ${entryUrl}
                ${error.message}`);
            });
    },

    CheckToken: function () {
        return new Promise((resolve, reject) => {
            if (!this.checkParams()) {
                reject(new Error('Parameters not ok.'));
            }
            if (this.needNewAppToken()) {
                resolve(this.PasswordToken());
            }
            resolve('Token ok.');
        });
    },

    SavePage: function (pageUrl) {
        const content = { url: pageUrl, archive: this.data.ArchiveByDefault ? 1 : 0 };
        const entriesUrl = `${this.data.Url}/api/entries.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Post(entriesUrl, this.data.ApiToken, content)
        )
            .catch(error => {
                throw new Error(`Failed to save page ${entriesUrl}
                ${error.message}`);
            });
    },

    RefreshToken: function () {
        const content = {
            grant_type: 'refresh_token',
            refresh_token: this.data.RefreshToken,
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret
        };
        return this.GetAppToken(content);
    },

    PasswordToken: function () {
        const content = {
            grant_type: 'password',
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret,
            username: this.data.UserLogin,
            password: this.data.UserPassword
        };
        return this.GetAppToken(content);
    },

    GetAppToken: function (content) {
        const oauthurl = `${this.data.Url}/oauth/v2/token`;
        return this.fetchApi.Post(oauthurl, '', content)
            .then(data => {
                if (data !== '') {
                    this.data.ApiToken = data.access_token;
                    this.data.RefreshToken = data.refresh_token;
                    this.data.ExpireDate = Date.now() + data.expires_in * 1000;
                    this.data.isTokenExpired = this.isTokenExpired();
                    return data;
                }
            })
            .catch(error => {
                throw new Error(`Failed to refresh token ${oauthurl}
                ${error.message}`);
            });
    },

    GetTags: function () {
        if (!this.checkParams()) {
            return false;
        }
        const entriesUrl = `${this.data.Url}/api/tags.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Get(entriesUrl, this.data.ApiToken)
        )
            .then(fetchData => {
                this.tags = fetchData;
                return fetchData;
            })
            .catch(error => {
                throw new Error(`Failed to get tags ${entriesUrl} ${error.message}`);
            });
    },

    EntryExists: function (url) {
        const entriesUrl = `${this.data.Url}/api/entries/exists.json?url=${url}`;

        return this.CheckToken().then(a =>
            this.fetchApi.Get(entriesUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to check if exists ${entriesUrl}
                ${error.message}`);
            });
    },

    GetArticle: function (articleId) {
        const entriesUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Get(entriesUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to get article ${entriesUrl}
                ${error.message}`);
            });
    },

    GetArticleTags: function (articleId) {
        const entriesUrl = `${this.data.Url}/api/entries/${articleId}/tags.json`;
        return this.CheckToken().then(a =>
            this.fetchApi.Get(entriesUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to get article tags ${entriesUrl}
                ${error.message}`);
            });
    }
};
