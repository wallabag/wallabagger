'use strict';

import { browser } from './browser-polyfill.js';
import { FetchApi } from './fetch-api.js';
import { hashUrl } from './utils/url.js';

class WallabagApi {
    defaultValues = {
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
        AllowExistSafe: null,
        Debug: false,
        AutoAddSingleTag: false,
        ArchiveByDefault: false,
        sitesToFetchLocally: null,
        FetchLocallyByDefault: false
    };

    data = {};

    #fetchApi = null;
    #logger = null;

    constructor (logger) {
        this.#logger = logger;
    }

    async init () {
        this.#logger.groupCollapsed('init');
        this.#logger.log('starting');
        Object.assign(this.data, this.defaultValues);
        this.#fetchApi = new FetchApi();
        await this.#load();
        this.#setAllowExistSafe();
        this.#logger.log('ending');
        this.#logger.groupEnd();
    }

    async forceInit () {
        if (!this.data.ClientId) {
            await this.init();
        }
    }

    async #load () {
        const result = await browser.storage.local.get('wallabagdata');

        if (result.wallabagdata != null) {
            this.#set(result.wallabagdata);
            if (this.checkParams()) {
                return this.data;
            }
        }
        this.clear();

        return this.data;
    }

    #needNewAppToken () {
        const need = (
            (this.data.ApiToken === '') ||
                  (this.data.ApiToken === null) ||
                  this.#isTokenExpired()
        );
        return need;
    }

    checkParams () {
        return ((this.data.ClientId !== null) &&
                 (this.data.ClientSecret !== null) &&
                 (this.data.UserLogin !== null) &&
                 (this.data.UserPassword !== null) &&
                 (this.data.ClientId !== '') &&
                 (this.data.ClientSecret !== '') &&
                 (this.data.UserLogin !== '') &&
                 (this.data.UserPassword !== ''));
    }

    // @TODO rename method to avoid conflict with data.isTokenExpired
    #isTokenExpired () {
        return Date.now() > this.data.ExpireDate;
    }

    clear () {
        this.#set(this.defaultValues);
        this.#logger.log('Some parameters are empty. Check the settings');
    }

    #set (params) {
        Object.assign(this.data, params);
    }

    saveParams (params) {
        this.#logger.setDebug(params.Debug);
        this.#set(params);
        browser.storage.local.set({ wallabagdata: this.data });
    }

    checkUrl () {
        const url_ = this.data.Url + '/api/version';
        return this.#fetchApi.get(url_, '')
            .then(fetchData => {
                this.data.ApiVersion = fetchData;
                this.#setAllowExistSafe();
                return fetchData;
            })
            .catch(error => {
                throw new Error(`Failed to get api version ${url_}
                ${error.message}`);
            });
    }

    async #setAllowExistSafe () {
        if (typeof (this.data.Url) !== 'string') {
            return false;
        }
        this.data.AllowExistSafe = await this.#supportsHashedUrl();
    }

    /**
     * @returns {Promise<[number, number, number]>}
     */
    #getVersion () {
        if (this.data.ApiVersion) return Promise.resolve(this.data.ApiVersion.split('.').map(Number));
        return this.checkUrl().then(() => this.#getVersion());
    }

    #supportsHashedUrl () {
        return this.#getVersion().then(([major, minor]) => {
            return (major > 2) || (major === 2 && minor >= 4);
        });
    }

    saveTitle (articleId, articleTitle) {
        return this.patchArticle(articleId, { title: articleTitle });
    }

    // @TODO remove data-apicall from options.html
    saveStarred (articleId, articleStarred) {
        return this.patchArticle(articleId, { starred: articleStarred });
    }

    // @TODO remove data-apicall from options.html
    saveArchived (articleId, articleArchived) {
        return this.patchArticle(articleId, { archive: articleArchived });
    }

    saveTags (articleId, taglist) {
        return this.patchArticle(articleId, { tags: taglist });
    }

    patchArticle (articleId, content) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.#checkToken().then(() =>
            this.#fetchApi.patch(entryUrl, this.data.ApiToken, content)
        )
            .catch(error => {
                throw new Error(`Failed to update article ${entryUrl}
                ${error.message}`);
            });
    }
    /** Delete article
     * @param articleId {number} Article identificator
     */
    deleteArticle (articleId) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.#checkToken().then(() =>
            this.#fetchApi.delete(entryUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to delete article ${entryUrl}
                ${error.message}`);
            });
    }

    deleteArticleTag (articleId, tagid) {
        const entryUrl = `${this.data.Url}/api/entries/${articleId}/tags/${tagid}.json`;
        return this.#checkToken().then(() =>
            this.#fetchApi.delete(entryUrl, this.data.ApiToken)
        )
            .catch(error => {
                throw new Error(`Failed to delete article tag ${entryUrl}
                ${error.message}`);
            });
    }

    #checkToken () {
        return new Promise((resolve, reject) => {
            if (!this.checkParams()) {
                reject(new Error('Parameters not ok.'));
            }
            if (this.#needNewAppToken()) {
                resolve(this.passwordToken());
            }
            resolve('Token ok.');
        });
    }

    isSiteToFetchLocally (pageUrl) {
        if (this.data.FetchLocallyByDefault) {
            return true;
        }
        if (!this.data.sitesToFetchLocally) {
            return false;
        }
        const sites = this.data.sitesToFetchLocally.split('\n');
        return sites.filter(function (item) {
            return pageUrl.indexOf(item) === 0;
        }).length > 0;
    }

    savePage (options) {
        const content = {
            url: options.url,
            origin_url: options.origin_url
        };
        if (this.data.ArchiveByDefault === true) {
            content.archive = 1;
        }
        if (options.title) {
            content.title = options.title;
        }
        if (options.content) {
            this.#logger.log('has local content', options.content);
            content.content = options.content;
        }
        const entriesUrl = `${this.data.Url}/api/entries.json`;
        return this.#checkToken().then(() =>
            this.#fetchApi.post(entriesUrl, this.data.ApiToken, content)
        )
            .catch(error => {
                throw new Error(`Failed to save page ${entriesUrl}
                ${error.message}`);
            });
    }

    passwordToken () {
        const content = {
            grant_type: 'password',
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret,
            username: this.data.UserLogin,
            password: this.data.UserPassword
        };
        return this.#getAppToken(content);
    }

    #getAppToken (content) {
        this.checkUrl();
        const oauthurl = `${this.data.Url}/oauth/v2/token`;
        return this.#fetchApi.post(oauthurl, '', content)
            .then(data => {
                if (data !== '') {
                    this.data.ApiToken = data.access_token;
                    this.data.RefreshToken = data.refresh_token;
                    this.data.ExpireDate = Date.now() + data.expires_in * 1000;
                    this.data.isTokenExpired = this.#isTokenExpired();
                    return data;
                }
            })
            .catch(error => {
                throw new Error(`Failed to refresh token ${oauthurl}
                ${error.message}`);
            });
    }

    async getTags () {
        await this.forceInit();
        if (!this.checkParams()) {
            return false;
        }
        const entriesUrl = `${this.data.Url}/api/tags.json`;
        return this.#checkToken().then(() =>
            this.#fetchApi.get(entriesUrl, this.data.ApiToken)
        )
            .then(fetchData => {
                return fetchData;
            })
            .catch(error => {
                throw new Error(`Failed to get tags ${entriesUrl} ${error.message}`);
            });
    }

    async entryExists (url) {
        const existsUrl = `${this.data.Url}/api/entries/exists.json`;

        try {
            await this.#checkToken();
            const urlValueParam = this.data.AllowExistSafe ?
                await hashUrl(url) : url;
            const keyParam = this.data.AllowExistSafe ?
                'hashed_url' : 'url';
            const requestUrl = `${existsUrl}?${keyParam}=${encodeURIComponent(urlValueParam)}`;
            return this.#fetchApi.get(requestUrl, this.data.ApiToken);
        } catch(error) {
            throw new Error(`Failed to ask ${existsUrl} whether ${url} exists ${error.message}`);
        }
    }
};

export { WallabagApi };
