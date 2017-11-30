var OptionsController = function () {
    this.protocolCheck_ = document.getElementById('protocol-checkbox');
    this.protocolLabel_ = document.getElementById('input-group-wallabagurl');
    this.wallabagurlinput_ = document.getElementById('input-wallabagurl');
    this.checkedLabel_ = document.getElementById('checked-label');
    this.versionLabel_ = document.getElementById('apiversion-label');
    this.checkurlbutton_ = document.getElementById('checkurl-button');
    this.tokenSection_ = document.getElementById('token-section');
    this.togglesSection = document.getElementById('toggles-section');

    this.clientId_ = document.getElementById('clientid-input');
    this.clientSecret_ = document.getElementById('clientsecret-input');
    this.userLogin_ = document.getElementById('userlogin-input');
    this.userPassword_ = document.getElementById('userpassword-input');
    this.getAppTokenButton_ = document.getElementById('getapptoken-button');
    this.tokenLabel_ = document.getElementById('apitoken-label');
    this.tokenExpire = document.getElementById('expiretoken-label');

    this.allowSpaceCheck = document.getElementById('allow-space-checkbox');
    this.allowExistCheck = document.getElementById('allow-exist-checkbox');
    this.debugEl = document.getElementById('debug');
    this.saveToFileButton = document.getElementById('saveToFile-button');
    this.loadFromFileButton = document.getElementById('loadFromFile-button');
    this.clearButton = document.getElementById('clear-button');
    this.openFileDialog = document.getElementById('openFile-dialog');
    this.httpsMessage = document.getElementById('https-message');
    this.httpsButton = document.getElementById('https-button');
    this.addListeners_();
};

OptionsController.prototype = {

    protocolCheck_: true,
    protocolLabel_: null,
    wallabagurlinput_: null,
    checkurlbutton_: null,
    versionLabel_: null,
    _debug: false,
    checkedLabel_: null,
    tokenSection_: null,
    togglesSection: null,
    clientId_: null,
    clientSecret_: null,
    userLogin_: null,
    userPassword_: null,
    getAppTokenButton_: null,
    tokenLabel_: null,
    tokenExpire: null,
    saveToFileButton: null,
    loadFromFileButton: null,
    openFileDialog: null,
    clearButton: null,

    allowSpaceCheck: null,
    allowExistCheck: null,
    debugEl: null,
    httpsButton: null,
    httpsMessage: null,

    data: null,
    port: null,

    addListeners_: function () {
        this.allowSpaceCheck.addEventListener('click', this.allowSpaceCheckClick.bind(this));
        this.allowExistCheck.addEventListener('click', this.allowExistCheckClick.bind(this));
        this.debugEl.addEventListener('click', this.debugClick.bind(this));
        this.protocolCheck_.addEventListener('click', this.handleProtocolClick.bind(this));
        this.checkurlbutton_.addEventListener('click', this.checkUrlClick.bind(this));
        this.getAppTokenButton_.addEventListener('click', this.getAppTokenClick.bind(this));
        this.saveToFileButton.addEventListener('click', this.saveToFileClick.bind(this));
        this.loadFromFileButton.addEventListener('click', this.loadFromFileClick.bind(this));
        this.clearButton.addEventListener('click', this.clearClick.bind(this));
        this.openFileDialog.addEventListener('change', this.loadFromFile.bind(this));
        this.httpsButton.addEventListener('click', this.httpsButtonClick.bind(this));
    },

    httpsButtonClick: function () {
        this.httpsMessage.classList.remove('active');
    },

    clearClick: function () {
        this.userLogin_.value = '';
        this.userPassword_.value = '';
        this.clientSecret_.value = '';
        this.clientId_.value = '';
        this.wallabagurlinput_.value = '';
        this.protocolLabel_.textContent = 'https://';
        this.protocolCheck_.checked = true;
        this.checkedLabel_.textContent = Common.translate('Not_checked');
        this.versionLabel_.textContent = Common.translate('Not_checked');
        this.tokenLabel_.textContent = Common.translate('Not_granted');
        this.tokenExpire.textContent = '';

        this.setDataFromFields();
        this.port.postMessage({request: 'setup-save', data: this.data});
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
                let obj = JSON.parse(textFromFileLoaded);
                if (this.debugEl.checked) {
                    console.log(textFromFileLoaded);
                    console.log(obj);
                }
                this.data = Object.assign({}, obj);
                this.setFields();
                this.port.postMessage({request: 'setup-save', data: this.data});
            }.bind(this);
            fileReader.readAsText(fileToLoad, 'UTF-8');
        }
    },

    saveToFileClick: function () {
        let textToSave = JSON.stringify(this.data);
        let textToSaveAsBlob = new Blob([textToSave], { type: 'text/plain' });
        let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
        let fileNameToSaveAs = 'wallabag.json';
        let downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.textContent = Common.translate('Download_file');
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = (event) => { document.body.removeChild(event.target); };
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
    },

    allowSpaceCheckClick: function (e) {
        Object.assign(this.data, { AllowSpaceInTags: this.allowSpaceCheck.checked });
        this.port.postMessage({request: 'setup-save', data: this.data});
    },

    allowExistCheckClick: function (e) {
        if (this.protocolCheck_.checked) {
            Object.assign(this.data, { AllowExistCheck: this.allowExistCheck.checked });
            this.port.postMessage({request: 'setup-save', data: this.data});
        } else {
            this.allowExistCheck.checked = false;
            this.httpsMessage.classList.add('active');
        }
    },

    debugClick: function () {
        Object.assign(this.data, { Debug: this.debugEl.checked });
        this.port.postMessage({request: 'setup-save', data: this.data});
    },

    wallabagApiTokenGot: function () {
        this._green(this.clientId_);
        this._green(this.clientSecret_);
        this._green(this.userLogin_);
        this._green(this.userPassword_);
        this.tokenLabel_.textContent = Common.translate('Granted');
        this.tokenExpire.textContent = this.getTokenExpireTime();
    },

    getTokenExpireTime: function () {
        const locale = Common.getLocale();
        const expMs = this.data.ExpireDate - Date.now();
        if (expMs < 0) {
            return Common.translate('Expired');
        }
        const expSec = Math.floor(expMs / 1000);
        const expMin = Math.floor(expSec / 60);
        if (expMin < 60) {
            const unit = this._getUnit(expMin, 'minute', locale);
            return `${expMin} ${unit}`;
        }
        const expHours = Math.floor(expMin / 60);
        if (expHours < 24) {
            const unit = this._getUnit(expHours, 'hour', locale);
            return `${expHours} ${unit}`;
        }
        const expDays = Math.floor(expHours / 24);
        const unit = this._getUnit(expDays, 'day', locale);
        return `${expDays} ${unit}`;
    },

    _getUnit(value, key, locale) {
        switch(locale) {
            case 'ru':
                const declension = value % 10;
                return (value <= 14 && value >=11) ? Common.translate(`${key}_many`) : declension === 1 ? Common.translate(`${key}_one`) : declension < 5 ? Common.translate(`${key}_few`) : Common.translate(`${key}_many`);
            default:
                return value > 1 ? Common.translate(`${key}_many`) : Common.translate(`${key}_one`);
        }
    },

    wallabagApiTokenNotGot: function () {
        this._red(this.clientId_);
        this._red(this.clientSecret_);
        this._red(this.userLogin_);
        this._red(this.userPassword_);
        this.tokenLabel_.textContent = Common.translate('Not_granted');
        this.tokenExpire.textContent = '';
    },

    getAppTokenClick: function (e) {
        e.preventDefault();

        if (this.clientId_.value === '') {
            this._red(this.clientId_);
        } else {
            this._green(this.clientId_);
        }

        if (this.clientSecret_.value === '') {
            this._red(this.clientSecret_);
        } else {
            this._green(this.clientSecret_);
        }

        if (this.userLogin_.value === '') {
            this._red(this.userLogin_);
        } else {
            this._green(this.userLogin_);
        }

        if (this.userPassword_.value === '') {
            this._red(this.userPassword_);
        } else {
            this._green(this.userPassword_);
        }

        if (this.clientId_.value !== '' && this.clientSecret_.value !== '' && this.userLogin_.value && this.userPassword_.value) {
            this.setDataFromFields();
            this.port.postMessage({request: 'setup-gettoken', data: this.data});
        }
    },

    setDataFromFields: function () {
        Object.assign(this.data, {
            Url: this.protocolLabel_.textContent + this.wallabagurlinput_.value,
            ClientId: this.clientId_.value,
            ClientSecret: this.clientSecret_.value,
            UserLogin: this.userLogin_.value,
            UserPassword: this.userPassword_.value
        });
    },

    handleProtocolClick: function () {
        if (this.protocolCheck_.checked) {
            this.protocolLabel_.textContent = 'https://';
        } else {
            this.protocolLabel_.textContent = 'http://';
            this.allowExistCheck.checked = false;
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
        if (this.data.ApiVersion) {
            this.versionLabel_.textContent = this.data.ApiVersion;
            if (this.data.ApiVersion.split('.')[0] === '2') {
                this.checkedLabel_.textContent = Common.translate('Ok');
                this._green(this.wallabagurlinput_);
                this._show(this.tokenSection_);
                this._show(this.togglesSection);
            }
        }
    },

    wallabagUrlNotChecked: function () {
        this._red(this.wallabagurlinput_);
        this._hide(this.tokenSection_);
        this._hide(this.togglesSection);
        this.checkedLabel_.textContent = Common.translate('Not_checked');
        this.versionLabel_.textContent = Common.translate('Not_checked');
    },

    checkUrlClick: function (e) {
        e.preventDefault();

        if (this.wallabagurlinput_.value !== '') {
            this.wallabagurlinput_.value = this._urlSanitized(this.wallabagurlinput_.value);
            Object.assign(this.data, { Url: this.protocolLabel_.textContent + this.wallabagurlinput_.value });
            this.port.postMessage({request: 'setup-checkurl', data: this.data});
        }
    },

    _urlSanitized: function (url) {
        return url.replace(/\/$/, '');
    },

    setFields: function () {
        const re = /^(http|https):\/\/(.*)/;
        if (re.test(this.data.Url)) {
            const res = re.exec(this.data.Url);
            this.protocolCheck_.checked = (res[1] === 'https');
            this.protocolLabel_.textContent = res[1] + '://';
            this.wallabagurlinput_.value = res[2];
        };

        if (this.wallabagurlinput_.value !== '') {
            this._show(this.tokenSection_);
            this._show(this.togglesSection);
        }
        this.wallabagUrlChecked();

        this.clientId_.value = this.data.ClientId || '';
        this.clientSecret_.value = this.data.ClientSecret || '';
        this.userLogin_.value = this.data.UserLogin || '';
        this.userPassword_.value = this.data.UserPassword || '';

        if (this.data.ApiToken) {
            this.tokenLabel_.textContent = Common.translate('Granted');
            this.tokenExpire.textContent = this.getTokenExpireTime();
        }

        if (this.data.isTokenExpired) {
            this.tokenLabel_.textContent = Common.translate('Expired');
            this.tokenExpire.textContent = '';
        }

        this.allowSpaceCheck.checked = this.data.AllowSpaceInTags;
        this.allowExistCheck.checked = this.data.AllowExistCheck;
        this.debugEl.checked = this.data.Debug;
    },

    messageListener: function (msg) {
        switch (msg.response) {
            case 'setup':
                this.data = Object.assign({}, msg.data);
                this.setFields();
                break;
            case 'setup-checkurl':
                Object.assign(this.data, msg.data);
                if (msg.result) {
                    this.wallabagUrlChecked();
                } else {
                    this.wallabagUrlNotChecked();
                }
                break;
            case 'setup-gettoken':
                Object.assign(this.data, msg.data);
                if (msg.result) {
                    this.wallabagApiTokenGot();
                } else {
                    this.wallabagApiTokenNotGot();
                }
                break;
            case 'setup-save':
                Object.assign(this.data, msg.data);
                if (this.data.Debug) {
                    console.log('setup saved:', msg.data);
                }
                break;
            default:
                if (this.data.Debug) {
                    console.log(`unknown message: ${msg}`);
                }
        };
    },

    init: function () {
        this.port = browser.runtime.connect({name: 'setup'});
        this.port.onMessage.addListener(this.messageListener.bind(this));
        this.port.postMessage({request: 'setup'});
    }

};

document.addEventListener('DOMContentLoaded', function () {
    if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
        browser = chrome;
    }
    Common.translateAll();
    const PC = new OptionsController();
    PC.init();
});
