var WallabagApi = function () { }

WallabagApi.prototype = {

    data: {
        Url: null,
        ApiVersion: null,
        ClientId: null,
        ClientSecret: null,
        UserLogin: null,
        UserPassword: null,
        ApiToken: null,
        RefreshToken: null,
        ExpireDateMs: null,
    },
    
    response_status: null,
    
    tags: [],

    save: function () {
        chrome.storage.local.set({ 'wallabagdata': this.data });
    },

    load: function () {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('wallabagdata', result => {
                if (result.wallabagdata != null) {
                    this.set(result.wallabagdata);
                    if (this.checkParams()) {
                        return resolve(this.data);
                    } else {
                        this.clear();
                        return reject(new Error("Some parameters are empty. Check the settings"));
                    }
                } else {
                    this.clear();
                    return reject(new Error("Saved parameters not found. Check the settings"));
                }
            });
        });
    },

    needNewAppToken: function(){
         let need =( 
                  (this.data.ApiToken == '') || 
                  (this.data.ApiToken == null) || 
                  this.expired()   
                   ) ;
         return need;          
    },
    
    checkParams: function(){
            return ( (this.data.ClientId != '') && 
                 (this.data.ClientSecret != '') && 
                 (this.data.userLogin != '') && 
                 (this.data.UserPassword != '') ) ;
    },

    expired: function () {
        // console.log(this.data.ExpireDateMs);
        // console.log(Date.now());
        // console.log((Date.now() > this.data.ExpireDateMs));
        return (this.data.ExpireDateMs != null) && (Date.now() > this.data.ExpireDateMs);
    },

    clear: function () {
        this.data.Url = null;
        this.data.ApiVersion = null;
        this.data.ClientId = null;
        this.data.ClientSecret = null;
        this.data.UserLogin = null;
        this.data.UserPassword = null;
        this.data.ApiToken = null;
        this.data.RefreshToken = null;
        this.data.ExpireDateMs = null;
    },

    set: function (params) {

        if ((params.Url != null) && (params.Url != '')) {
            this.data.Url = params.Url;
        }
        if ((params.ApiVersion != null) && (params.ApiVersion != '')) {
            this.data.ApiVersion = params.ApiVersion;
        }
        if ((params.ClientId != null) && (params.ClientId != '')) {
            this.data.ClientId = params.ClientId;
        }
        if ((params.ClientSecret != null) && (params.ClientSecret != '')) {
            this.data.ClientSecret = params.ClientSecret;
        }
        if ((params.UserLogin != null) && (params.UserLogin != '')) {
            this.data.UserLogin = params.UserLogin;
        }
        if ((params.UserPassword != null) && (params.UserPassword != '')) {
            this.data.UserPassword = params.UserPassword;
        }
        if ((params.ApiToken != null) && (params.ApiToken != '')) {
            this.data.ApiToken = params.ApiToken;
        }
        if ((params.RefreshToken != null) && (params.RefreshToken != '')) {
            this.data.RefreshToken = params.RefreshToken;
        }
        if ((params.ExpireDateMs != null) && (params.ExpireDateMs != '')) {
            this.data.ExpireDateMs = params.ExpireDateMs;
        }

    },

    _status: function (j) {
        if ( this.response_status >= 200 && this.response_status < 300) {
            return Promise.resolve(j);
        } else {
            return Promise.reject( new Error(JSON.stringify(j)) );
        }
    },

    _json: function (response) {
        this.response_status = response.status;
        return response.json()
    },

    CheckUrl: function () {
        let url_ = this.data.Url + '/api/version'
        return fetch(url_, { method: 'get', mode: 'cors' })
            .then(this._json)
            .then(this._status)
            .then(fetchData => { this.data.ApiVersion = fetchData; return fetchData })
            .catch( error => { throw new Error(`Failed to get api version ${url_}
                ${error.message}`);  } )
                ;

    },

    AuhorizedHeader: function() {
        return new Headers({
        'Authorization': `Bearer ${this.data.ApiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate' });
    },

    NotAuhorizedHeader: function() {
        return new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate' });
    },

    RequestInit: function(rmethod,rheaders,content){
        
        let options = {
            method: rmethod,
            headers: rheaders,
            mode: 'cors',
            cache: 'default'
        };
        
        if ((content != '') && (content != null)){
            options.body = content;
        };
        
        return options;
        
    },

    SaveTitle: function (articleId, aruticleTitle) {

        return this.PatchArticle(articleId, JSON.stringify({ title: aruticleTitle }));

    },

    SaveStarred: function (articleId, aruticleStarred) {

        return this.PatchArticle(articleId, JSON.stringify({ starred: aruticleStarred }));

    },

    SaveArchived: function (articleId, aruticleArchived) {

        return this.PatchArticle(articleId, JSON.stringify({ archived: aruticleArchived }));

    },

    SaveTags: function (articleId, taglist) {

        return this.PatchArticle(articleId, JSON.stringify({ tags: taglist }));

    },


    PatchArticle: function (articleId, content) {

        let entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;

        let rinit =  this.RequestInit("PATCH", this.AuhorizedHeader(), content);

        return fetch( entryUrl, rinit )
            .then(this._json)
            .then(this._status)
            .catch( error => { throw new Error(`Failed to update article ${entryUrl}
                ${error.message}`);  } );


    },

    DeleteArticle: function (articleId) {

        let entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;

        let rinit =  this.RequestInit("DELETE", this.AuhorizedHeader(), '');

        return fetch( entryUrl, rinit )
            .then(this._json)
            .then(this._status)
             .catch( error => { throw new Error(`Failed to delete article ${entryUrl}
                ${error.message}`);  } )           ;

    },

    DeleteArticleTag: function (articleId,tagid) {

        let entryUrl = `${this.data.Url}/api/entries/${articleId}/tags/${tagid}.json`;

        let rinit =  this.RequestInit("DELETE", this.AuhorizedHeader(), '');

        return fetch( entryUrl, rinit )
            .then(this._json)
            .then(this._status)
            .catch( error => { throw new Error(`Failed to delete article tag ${entryUrl}
                ${error.message}`);  } )
                ;

    },
    

 
    SavePage: function (pageUrl) {

        let content = JSON.stringify( { url: pageUrl });

        let entriesUrl = `${this.data.Url}/api/entries.json`;

        let rheaders = this.AuhorizedHeader();

        let rinit = this.RequestInit("POST", this.AuhorizedHeader(), content); 

        return fetch( entriesUrl, rinit)
            .then(this._json)
            .then(this._status)
            .catch( error => { throw new Error(`Failed to save page ${entriesUrl}
                ${error.message}`);  } )
            ;

    },

    RefreshToken: function () {

        let content = JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: this.data.RefreshToken,
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret
        });

        let oauthurl = `${this.data.Url}/oauth/v2/token`;
       
        let rinit = this.RequestInit("POST", this.NotAuhorizedHeader(), content); 
 
        return fetch( oauthurl, rinit)
            .then(this._json)
            .then(this._status)
            .then(data => {
                if (data != '') {
                    this.data.ApiToken = data.access_token;
                    this.data.RefreshToken = data.refresh_token;
                    let nowDate = new Date(Date.now());
                    this.data.ExpireDateMs = nowDate.setSeconds(nowDate.getSeconds() + data.expires_in);
                    return data;
                }
            })
            .catch( error => { throw new Error(`Failed to refresh token ${oauthurl}
                ${error.message}`);  } );
    },

    GetTags: function () {

       let entriesUrl = `${this.data.Url}/api/tags.json`;

       let rinit = this.RequestInit("GET", this.AuhorizedHeader(), ''); 
      
       return fetch( entriesUrl, rinit )
            .then(this._json)
            .then(this._status)
            .then(fetchData => { this.tags = fetchData; return fetchData })
            .catch( error => { throw new Error(`Failed to get tags ${entriesUrl}
                ${error.message}`);  } );
    },

    GetArticle: function (articleId) {

       let entriesUrl = `${this.data.Url}/api/entries/${articleId}.json`;

       let rinit = this.RequestInit("GET", this.AuhorizedHeader(), ''); 
      
       return fetch( entriesUrl, rinit )
            .then(this._json)
            .then(this._status)            
            .then(fetchData => { return fetchData })            
            .catch( error => { throw new Error(`Failed to get article ${entriesUrl}
                ${error.message}`);  } );
    },

    GetArticleTags: function (articleId) {

       let entriesUrl = `${this.data.Url}/api/entries/${articleId}/tags.json`;

       let rinit = this.RequestInit("GET", this.AuhorizedHeader(), ''); 
      
       return fetch( entriesUrl, rinit )
            .then(this._json)            
            .then(this._status)
            .then(fetchData => { return fetchData })
            .catch( error => { throw new Error(`Failed to get article tags ${entriesUrl}
                ${error.message}`);  } );

    },


    // CheckAppToken: function () {

    //    let entriesUrl = `${this.data.Url}/api/entries.json?perPage=1`;

    //    let rinit = this.RequestInit("GET", this.AuhorizedHeader(), ''); 
      
    //    return fetch( entriesUrl, rinit )
    //         .then(this._status)
    //         .then(this._json);

    // },

    GetAppToken: function () {

        let content = JSON.stringify({
            grant_type: 'password',
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret,
            username: this.data.UserLogin,
            password: this.data.UserPassword
        });
        
        let oauthurl = `${this.data.Url}/oauth/v2/token`;
        
       let rinit = this.RequestInit("POST", this.NotAuhorizedHeader(), content); 

        return fetch( oauthurl, rinit )
            .then(this._json)
            .then(this._status)
            .then(fetchData => {
                let nowDate = (new Date());
                this.data.ApiToken = fetchData.access_token;
                this.data.RefreshToken = fetchData.refresh_token;
                this.data.ExpireDateMs = nowDate.setSeconds(nowDate.getSeconds() + fetchData.expires_in);
                return fetchData;
            }).catch( error => {
                throw new Error(`Failed to get app token from ${oauthurl}
                ${error.message}`);
            } );

    }

}

/**/