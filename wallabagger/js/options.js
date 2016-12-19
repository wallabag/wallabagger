var OptionsController = function () {
    this.protocolCheck_ = document.getElementById('protocol-checkbox');
    this.protocolLabel_ = document.getElementById('input-group-wallabagurl');
    this.wallabagurlinput_ = document.getElementById('input-wallabagurl');
    this.checkedLabel_ = document.getElementById('checked-label');
    this.versionLabel_ = document.getElementById('apiversion-label');
    this.checkurlbutton_ = document.getElementById('checkurl-button');
    this.tokenSection_ = document.getElementById('token-section');

    this.clientId_ = document.getElementById('clientid-input');
    this.clientSecret_ = document.getElementById('clientsecret-input');
    this.userLogin_ = document.getElementById('userlogin-input');
    this.userPassword_ = document.getElementById('userpassword-input');
    this.getAppTokenButton_ = document.getElementById('getapptoken-button');

    //  this.appTokenInput_ = document.getElementById("apptoken-input");
    this.tokenLabel_ = document.getElementById('apitoken-label');
    //  this.checkTokenButton_ = document.getElementById("checktoken-button");

    //  this.refrTokenInput_ = document.getElementById("refreshtoken-input");
    //   this.refreshTokenButton_ = document.getElementById("refreshtoken-button");

    //   this.tokenExpiresInput = document.getElementById("tokenexpired-input");
    this.allowSpaceCheck = document.getElementById('allow-space-checkbox');

    this.saveToFileButton = document.getElementById('saveToFile-button');
    this.loadFromFileButton = document.getElementById('loadFromFile-button');
    this.clearButton = document.getElementById('clear-button');
    this.openFileDialog = document.getElementById('openFile-dialog');
    // this.saveToLocalButton = document.getElementById("saveToLocal-button");
    // this.loadFromLocalButton = document.getElementById("loadFromLocal-button");

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
    saveToFileButton: null,
    loadFromFileButton: null,
    openFileDialog: null,
    clearButton: null,
    // saveToLocalButton: null,
    // loadFromLocalButton: null,

    allowSpaceCheck: null,

    api: null,

    addListeners_: function () {
        this.allowSpaceCheck.addEventListener('click', this.allowSpaceCheckClick.bind(this));
        this.protocolCheck_.addEventListener('click', this.handleProtocolClick.bind(this));
        // this.savebutton_.addEventListener('click', this.saveClick_.bind(this));
        this.checkurlbutton_.addEventListener('click', this.checkUrlClick.bind(this));
        this.getAppTokenButton_.addEventListener('click', this.getAppTokenClick.bind(this));
        //      this.checkTokenButton_.addEventListener('click', this.checkTokenClick.bind(this));
        //      this.refreshTokenButton_.addEventListener('click', this.refreshTokenClick.bind(this));
        this.saveToFileButton.addEventListener('click', this.saveToFileClick.bind(this));
        this.loadFromFileButton.addEventListener('click', this.loadFromFileClick.bind(this));
        this.clearButton.addEventListener('click', this.clearClick.bind(this));
        // this.saveToLocalButton.addEventListener('click', this.saveToLocal.bind(this));
        // this.loadFromLocalButton.addEventListener('click', this.loadFromLocal.bind(this));

        this.openFileDialog.addEventListener('change', this.loadFromFile.bind(this));
    },

    // saveToLocal: function () {
    //     localStorage.setItem("wallabagger", JSON.stringify(this.api.data));
    // },

    // loadFromLocal: function () {
    //     let obj = JSON.parse(localStorage.getItem("wallabagger"));
    //     this.api.set(obj);
    //     this.setFields(obj);
    //     this.api.save();
    // },

    clearClick: function () {
        this.userLogin_.value = '';
        this.userPassword_.value = '';
        this.clientSecret_.value = '';
        this.clientId_.value = '';
        this.wallabagurlinput_.value = '';
        this.protocolLabel_.innerText = 'http://';
        this.protocolCheck_.checked = false;
    },

    loadFromFileClick: function () {
        this.openFileDialog.value = null;
        this.openFileDialog.click();
    },

    loadFromFile: function () {
        if (this.openFileDialog.value !== '') {
            var fileToLoad = this.openFileDialog.files[0];
            let fileReader = new FileReader();
            fileReader.onload = function (fileLoadedEvent) {
                let textFromFileLoaded = fileLoadedEvent.target.result;
                console.log(textFromFileLoaded);
                let obj = JSON.parse(textFromFileLoaded);
                console.log(obj);
                this.api.set(obj);
                this.setFields(obj);
                this.api.save();
            }.bind(this);
            fileReader.readAsText(fileToLoad, 'UTF-8');
        }
    },

    saveToFileClick: function () {
        let textToSave = JSON.stringify(this.api.data);
        let textToSaveAsBlob = new Blob([textToSave], { type: 'text/plain' });
        let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
        let fileNameToSaveAs = 'wallabag.json';
        let downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = 'Download File';
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = (event) => { document.body.removeChild(event.target); };
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
    },

    allowSpaceCheckClick: function (e) {
        this.api.set({ AllowSpaceInTags: this.allowSpaceCheck.checked });
        this.api.save();
    },

    wallabagApiTokenGot: function () {
        this.api.save();

        this._green(this.clientId_);
        this._green(this.clientSecret_);
        this._green(this.userLogin_);
        this._green(this.userPassword_);
        //   this.appTokenInput_.value = this.api.data.ApiToken;
        //   this.refrTokenInput_.value = this.api.data.RefreshToken;
        //   let expireDate = this.api.data.ExpireDateMs;
        //   this.tokenExpiresInput.value = new Date(  expireDate );
        this.tokenLabel_.innerHTML = 'Granted';
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
        this.tokenLabel_.innerHTML = 'Not granted';
    },

    getAppTokenClick: function (e) {
        e.preventDefault();

        if (this.clientId_.value === '') {
            this._red(this.clientId_);
        } else {
            //            chrome.storage.local.set({ 'wallabagclientid': this.clientId_.value });
            this._green(this.clientId_);
        }

        if (this.clientSecret_.value === '') {
            this._red(this.clientSecret_);
        } else {
            //            chrome.storage.local.set({ 'wallabagclientsecret': this.clientSecret_.value });
            this._green(this.clientSecret_);
        }

        if (this.userLogin_.value === '') {
            this._red(this.userLogin_);
        } else {
            //            chrome.storage.local.set({ 'wallabaguserlogin': this.userLogin_.value });
            this._green(this.userLogin_);
        }

        if (this.userPassword_.value === '') {
            this._red(this.userPassword_);
        } else {
            this._green(this.userPassword_);
        }

        if (this.clientId_.value !== '' && this.clientSecret_.value !== '' && this.userLogin_.value && this.userPassword_.value) {
            // wallabagGetAppToken: wallabagGetAppToken: function(aUrl, clientId, clientSecret, userId, userPassword){
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
                .catch(() => {
                    //                    console.log('wallabag api token get error: ' + error);
                    this.wallabagApiTokenNotGot();
                });
        }
    },

    handleProtocolClick: function () {
        if (this.protocolCheck_.checked) {
            this.protocolLabel_.innerText = 'https://';
        } else {
            this.protocolLabel_.innerText = 'http://';
        }
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
        if (this.api.data.ApiVersion !== '') {
            this.versionLabel_.innerHTML = this.api.data.ApiVersion;
            //            chrome.storage.local.set({ 'wallabagapiversion': this.api.data.ApiVersion });
            this.api.save();
            if (this.api.data.ApiVersion.split('.')[0] === '2') {
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
        this.checkedLabel_.innerHTML = 'Not checked';
        this.versionLabel_.innerHTML = 'Not checked';
    },

    checkUrlClick: function (e) {
        e.preventDefault();

        if (this.wallabagurlinput_.value !== '') {
            this.api.set({ Url: this.protocolLabel_.innerText + this.wallabagurlinput_.value });

            this.api.CheckUrl()
                .then(data => {
                    //                    console.log('wallabag url checked: ' + JSON.stringify(data));
                    this.wallabagUrlChecked();
                })
                .catch(() => {
                    //                    console.log('wallabag url check error: ' + error);
                    this.wallabagUrlNotChecked();
                });
        }
    },

    setFields: function (data) {
        const re = /^(http|https):\/\/(.*)/;
        if (re.test(data.Url)) {
            const res = re.exec(data.Url);
            this.protocolCheck_.checked = (res[1] === 'https');
            this.protocolLabel_.innerText = res[1] + '://';
            this.wallabagurlinput_.value = res[2];
        };

        if (this.wallabagurlinput_.value !== '') {
            this._show(this.tokenSection_);
        }

        if (data.ApiVersion) {
            this.versionLabel_.innerHTML = data.ApiVersion;
            if (data.ApiVersion.split('.')[0] === '2') {
                this.checkedLabel_.innerHTML = 'OK';
                this._green(this.wallabagurlinput_);
                this._show(this.tokenSection_);
            }
        }

        this.clientId_.value = data.ClientId || '';
        this.clientSecret_.value = data.ClientSecret || '';
        this.userLogin_.value = data.UserLogin || '';
        this.userPassword_.value = data.UserPassword || '';

        if (data.ApiToken) {
            this.tokenLabel_.innerHTML = 'Granted';
        }

        if (this.api.data.ExpireDateMs && this.api.expired) {
            this.tokenLabel_.innerHTML = 'Expired';
        }
    },

    init: function () {
        this.api = new WallabagApi();

        this.api.load().then(data => {
            this.setFields(data);
        }).catch(data => { });
    }

};

document.addEventListener('DOMContentLoaded', function () {
    const PC = new OptionsController();
    PC.init();
});
