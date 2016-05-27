var OptionsController = function () {

    this.protocolCheck_ = document.getElementById('protocol-checkbox');
    this.protocolLabel_ = document.getElementById('input-group-wallabagurl');
    this.wallabagurlinput_ = document.getElementById('input-wallabagurl');
    this.checkedLabel_ = document.getElementById("checked-label");
    this.versionLabel_ = document.getElementById("apiversion-label");
    this.checkurlbutton_ = document.getElementById('checkurl-button');
    this.tokenSection_ = document.getElementById("token-section");

    this.clientId_ = document.getElementById("clientid-input");
    this.clientSecret_ = document.getElementById("clientsecret-input");
    this.userLogin_ = document.getElementById("userlogin-input");
    this.userPassword_ = document.getElementById("userpassword-input");
    this.getAppTokenButton_ = document.getElementById("getapptoken-button");

    //  this.appTokenInput_ = document.getElementById("apptoken-input");
    this.tokenLabel_ = document.getElementById("apitoken-label");
    //  this.checkTokenButton_ = document.getElementById("checktoken-button");

    //  this.refrTokenInput_ = document.getElementById("refreshtoken-input");
    //   this.refreshTokenButton_ = document.getElementById("refreshtoken-button");

    //   this.tokenExpiresInput = document.getElementById("tokenexpired-input");

    this.addListeners_();

};


OptionsController.prototype = {

    protocolCheck_: null,
    protocolLabel_: null,
    wallabagurlinput_: null,
    // savebutton_: null,
    checkurlbutton_: null,
    versionLabel_: null,
    _debug: false,
    checkedLabel_: null,
    tokenSection_: null,
    clientId_: null,
    clientSecret_: null,
    userLogin_: null,
    userPassword_: null,
    getAppTokenButton_: null,
    //    appTokenInput_: null,
    tokenLabel_: null,
    //    checkTokenButton_: null,
    //    refrTokenInput_: null,
    //    refreshTokenButton_: null,
    //    tokenExpiresInput: null,

    api: null,

    addListeners_: function () {
        this.protocolCheck_.addEventListener('click', this.handleProtocolClick.bind(this));
        // this.savebutton_.addEventListener('click', this.saveClick_.bind(this));
        this.checkurlbutton_.addEventListener('click', this.checkUrlClick.bind(this));
        this.getAppTokenButton_.addEventListener('click', this.getAppTokenClick.bind(this));
        //      this.checkTokenButton_.addEventListener('click', this.checkTokenClick.bind(this));
        //      this.refreshTokenButton_.addEventListener('click', this.refreshTokenClick.bind(this));
    },

    // refreshTokenClick: function (e) {
    //     e.preventDefault();

    //     this._hide( document.getElementById("errorinfo") );

    //     if (this.clientId_.value != '' && this.clientSecret_.value != '' && this.refrTokenInput_.value != '') {

    //         this.api.RefreshToken()
    //             .then(data => {
    //                 if (data != '') {
    //                         console.log(data);
    //                         this.appTokenInput_.value = data.access_token;
    //                         this.refrTokenInput_.value = data.refresh_token;
    //                         this.tokenLabel_.innerHTML = "Granted";
    //                         let nowDate = (new Date()); 
    //                         let expireDate = nowDate.setSeconds(nowDate.getSeconds() + data.expires_in) ;
    //                         this.tokenExpiresInput.value = new Date(  expireDate );
    //                         this.api.save(); 
    //                 }
    //             }).catch(error => {
    //                 console.log(error);
    //                 this.tokenLabel_.innerHTML = "error";
    //             });

    //     }
    // },

    // checkTokenClick: function (e) {
    //     e.preventDefault();
    //     if (this.appTokenInput_.value != '') {

    //         this.api.CheckAppToken()
    //                 .then(data => {
    //                 if (data != '') {
    //                     this.tokenLabel_.innerHTML = "Checked, total articles: "+data.total;
    //                 }
    //                 })
    //                 .catch(error => {
    //                 console.log(error);
    //             }); 
    //     }
    // },


    wallabagApiTokenGot: function () {

        this.api.save();

        this._green(this.clientId_);
        this._green(this.clientSecret_);
        this._green(this.userLogin_);
        this._green(this.userPassword_);
        //   this.appTokenInput_.value = this.api.data.ApiToken;
        //   this.refrTokenInput_.value = this.api.data.RefreshToken;
        let expireDate = this.api.data.ExpireDateMs;
        //   this.tokenExpiresInput.value = new Date(  expireDate ); 
        this.tokenLabel_.innerHTML = "Granted";

    },

    wallabagApiTokenNotGot: function () {

        this._red(this.clientId_);
        this._red(this.clientSecret_);
        this._red(this.userLogin_);
        this._red(this.userPassword_);
        // this.appTokenInput_.value = '';
        // this.refrTokenInput_.value = '';
        // chrome.storage.local.set({ 'wallabagapptoken': '' });
        // chrome.storage.local.set({ 'wallabagrefreshtoken': '' });
        this.tokenLabel_.innerHTML = "Not granted";

    },

    getAppTokenClick: function (e) {

        e.preventDefault();

        if (this.clientId_.value == '') {
            this._red(this.clientId_);
        } else {
            //            chrome.storage.local.set({ 'wallabagclientid': this.clientId_.value });
            this._green(this.clientId_);
        }

        if (this.clientSecret_.value == '') {
            this._red(this.clientSecret_);
        } else {
            //            chrome.storage.local.set({ 'wallabagclientsecret': this.clientSecret_.value });
            this._green(this.clientSecret_);
        }

        if (this.userLogin_.value == '') {
            this._red(this.userLogin_);
        } else {
            //            chrome.storage.local.set({ 'wallabaguserlogin': this.userLogin_.value });
            this._green(this.userLogin_);
        }

        if (this.userPassword_.value == '') {
            this._red(this.userPassword_);
        } else {
            this._green(this.userPassword_);
        }

        if (this.clientId_.value != '' && this.clientSecret_.value != '' && this.userLogin_.value && this.userPassword_.value) {
            //wallabagGetAppToken: wallabagGetAppToken: function(aUrl, clientId, clientSecret, userId, userPassword){
            this.api.set({
                Url: this.protocolLabel_.innerText + this.wallabagurlinput_.value,
                ClientId: this.clientId_.value,
                ClientSecret: this.clientSecret_.value,
                UserLogin: this.userLogin_.value,
                UserPassword: this.userPassword_.value
            }
            );
            this.api.GetAppToken(this.userPassword_.value)
                .then(data => {
//                    console.log('wallabag api token get: ' + JSON.stringify(data));
                    this.wallabagApiTokenGot();
                })
                .catch(error => {
//                    console.log('wallabag api token get error: ' + error);
                    this.wallabagApiTokenNotGot();
                });
        }
    },

    handleProtocolClick: function () {

        if (this.protocolCheck_.checked) {
            this.protocolLabel_.innerText = 'https://'
        } else {
            this.protocolLabel_.innerText = 'http://'
        }

    },

    _status: function (response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response)
        } else {
            return Promise.reject(new Error(response.statusText))
        }
    },

    _json: function (response) {
        return response.json()
    },

    _hide: function (element) {
        element.classList.add('hide');
    },

    _show: function (element) {
        element.classList.remove('hide');
    },


    _grey: function (element) {
        element.classList.remove('is-danger');
        element.classList.remove('is-success');
    },


    _green: function (element) {
        element.classList.remove('is-danger');
        element.classList.add('is-success');
    },

    _red: function (element) {
        element.classList.add('is-danger');
        element.classList.remove('is-success');
    },

    wallabagUrlChecked: function () {
        if (this.api.data.ApiVersion != '') {
            this.versionLabel_.innerHTML = this.api.data.ApiVersion;
            //            chrome.storage.local.set({ 'wallabagapiversion': this.api.data.ApiVersion });
            this.api.save();
            if (this.api.data.ApiVersion.split('.')[0] == '2') {
                //                chrome.storage.local.set({ 'wallabagchecked': 'OK' });
                this.checkedLabel_.innerHTML = 'OK';
                this._green(this.wallabagurlinput_);
                this._show(this.tokenSection_);
            }
        }
    },

    wallabagUrlNotChecked: function () {
        this.api.clear();
        this.api.save();
        this._red(this.wallabagurlinput_);
        this._hide(this.tokenSection_);
        this.checkedLabel_.innerHTML = "Not checked";
        this.versionLabel_.innerHTML = "Not checked";
    },


    checkUrlClick: function (e) {

        e.preventDefault();

        if (this.wallabagurlinput_.value != '') {

            this.api.set({ Url: this.protocolLabel_.innerText + this.wallabagurlinput_.value });

            this.api.CheckUrl()
                .then(data => {
//                    console.log('wallabag url checked: ' + JSON.stringify(data));
                    this.wallabagUrlChecked();
                })
                .catch(error => {
//                    console.log('wallabag url check error: ' + error);
                    this.wallabagUrlNotChecked();
                });

        }

    },

    init: function () {

        this.api = new WallabagApi();

        this.api.load().then(data => {

            let wburl = data.Url;
            let re = /^(http|https):\/\/(.*)/;
            if (re.test(wburl)) {
                res = re.exec(wburl);
                this.protocolCheck_.checked = (res[1] == "https");
                this.protocolLabel_.innerText = res[1] + "://";
                this.wallabagurlinput_.value = res[2];
            };
            let apiv = data.ApiVersion;
            if ((apiv != '') && (apiv != null)) {
                this.versionLabel_.innerHTML = apiv;
                if (apiv.split('.')[0] == '2') {
                    this.checkedLabel_.innerHTML = 'OK';
                    this._green(this.wallabagurlinput_);
                    this._show(this.tokenSection_);
                }
            }
            let clid = data.ClientId;
            if ((clid != '') && (clid != null)) {
                this.clientId_.value = clid;
            }
            let clsc = data.ClientSecret;
            if ((clsc != '') && (clsc != null)) {
                this.clientSecret_.value = clsc;
            }
            let usrlg = data.UserLogin;
            if ((usrlg != '') && (usrlg != null)) {
                this.userLogin_.value = usrlg;
            }
            let usrp = data.UserPassword;
            if ((usrp != '') && (usrp != null)) {
                this.userPassword_.value = usrp;
            }
            let atoken = data.ApiToken;
            if ((atoken != '') && (atoken != null)) {
                //                this.appTokenInput_.value = atoken;
                this.tokenLabel_.innerHTML = "Granted";
            }
            let rtoken = data.RefreshToken;
            if ((rtoken != '') && (rtoken != null)) {
                //             this.refrTokenInput_.value = rtoken;
            }
            let expireDate = this.api.data.ExpireDateMs;
            if ((expireDate != null)) {
                this.tokenExpiresInput.value = new Date(expireDate);
                if (this.api.expired) {
                    this.tokenLabel_.innerHTML = "Expired"
                }
            }

        }).catch(data => { });

    }
};

document.addEventListener('DOMContentLoaded', function () {
    window.PC = new OptionsController();
    PC.init();
});