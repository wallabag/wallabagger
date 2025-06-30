import { browser } from './browser-polyfill.js';
import { Common } from './common.js';

class OptionsController {
    constructor () {
        this.protocolCheck_ = document.getElementById('protocol-checkbox');
        this.protocolLabel_ = document.getElementById('input-group-wallabagurl');
        this.wallabagurlinput_ = document.getElementById('input-wallabagurl');
        this.checkedLabel_ = document.getElementById('checked-label');
        this.permissionLabel_ = document.getElementById('permission-label');
        this.permissionText_ = document.getElementById('permission-text');
        this.versionLabel_ = document.getElementById('apiversion-label');
        this.checkurlbutton_ = document.getElementById('checkurl-button');
        this.checkUrlMessage_ = document.getElementById('checkurl-message');
        this.tokenSection_ = document.getElementById('token-section');
        this.togglesSection = document.getElementById('toggles-section');

        this.clientId_ = document.getElementById('clientid-input');
        this.clientSecret_ = document.getElementById('clientsecret-input');
        this.userLogin_ = document.getElementById('userlogin-input');
        this.userPassword_ = document.getElementById('userpassword-input');
        this.sitesToFetchLocallyEl = document.getElementById('sites-to-fetch-locally');
        this.getAppTokenButton_ = document.getElementById('getapptoken-button');
        this.tokenLabel_ = document.getElementById('apitoken-label');

        this.allowSpaceCheck = document.getElementById('allow-space-checkbox');
        this.allowExistCheck = document.getElementById('allow-exist-checkbox');
        this.allowExistInsecureText = document.getElementById('allow-exist-insecure-text');
        this.allowExistSecureText = document.getElementById('allow-exist-secure-text');
        this.fetchLocallyByDefault = document.getElementById('fetch-locally-by-default-checkbox');
        this.archiveByDefault = document.getElementById('archive-by-default-checkbox');
        this.debugEl = document.getElementById('debug');
        this.saveToFileButton = document.getElementById('saveToFile-button');
        this.loadFromFileButton = document.getElementById('loadFromFile-button');
        this.clearButton = document.getElementById('clear-button');
        this.openFileDialog = document.getElementById('openFile-dialog');
        this.httpsMessage = document.getElementById('https-message');
        this.httpsButton = document.getElementById('https-button');
        this.autoAddSingleTag = document.getElementById('single-tag');
        this.clientSelector = new ClientSelector(document.getElementById('client-selector'));
        this.addListeners_();
        this.data = null;
        this.port = null;
    }

    addListeners_ () {
        this.allowSpaceCheck.addEventListener('click', this.allowSpaceCheckClick.bind(this));
        this.fetchLocallyByDefault.addEventListener('click', this.fetchLocallyByDefaultClick.bind(this));
        this.archiveByDefault.addEventListener('click', this.archiveByDefaultClick.bind(this));
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
        this.autoAddSingleTag.addEventListener('click', this.autoAddSingleTagClick.bind(this));
    }

    httpsButtonClick () {
        this.httpsMessage.classList.remove('active');
    }

    clearClick () {
        this.userLogin_.value = '';
        this.userPassword_.value = '';
        this.clientSecret_.value = '';
        this.clientId_.value = '';
        this.wallabagurlinput_.value = '';
        this.protocolLabel_.textContent = 'https://';
        this.protocolCheck_.checked = true;
        this.checkedLabel_.textContent = Common.translate('Not_checked');
        this.permissionLabel_.textContent = Common.translate('Not_checked');
        this.versionLabel_.textContent = Common.translate('Not_checked');
        this.tokenLabel_.textContent = Common.translate('Not_checked');
        this.data.isFetchPermissionGranted = false;
        this.setDataFromFields();
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    loadFromFileClick () {
        this.openFileDialog.value = null;
        this.openFileDialog.click();
    }

    loadFromFile () {
        if (this.openFileDialog.value !== '') {
            const fileToLoad = this.openFileDialog.files[0];
            const fileReader = new FileReader();
            fileReader.onload = function (fileLoadedEvent) {
                const textFromFileLoaded = fileLoadedEvent.target.result;
                const obj = JSON.parse(textFromFileLoaded);
                if (this.debugEl.checked) {
                    console.log(textFromFileLoaded);
                    console.log(obj);
                }
                this.data = Object.assign({}, obj);
                this.setFields();
                this.data.isFetchPermissionGranted = false;
                this.permissionLabel_.textContent = Common.translate('Not_checked');
                this.port.postMessage({ request: 'setup-save', data: this.data });
            }.bind(this);
            fileReader.readAsText(fileToLoad, 'UTF-8');
        }
    }

    saveToFileClick () {
        const body = document.querySelector('body');
        const textToSave = JSON.stringify(this.data);
        const textToSaveAsBlob = new Blob([textToSave], { type: 'text/plain' });
        const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
        const fileNameToSaveAs = 'wallabag.json';
        const downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.textContent = Common.translate('Download_file');
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = (event) => { body.removeChild(event.target); };
        downloadLink.style.display = 'none';
        body.appendChild(downloadLink);
        downloadLink.click();
    }

    autoAddSingleTagClick (e) {
        Object.assign(this.data, { AutoAddSingleTag: this.autoAddSingleTag.checked });
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    allowSpaceCheckClick (e) {
        Object.assign(this.data, { AllowSpaceInTags: this.allowSpaceCheck.checked });
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    fetchLocallyByDefaultClick (e) {
        Object.assign(this.data, { FetchLocallyByDefault: this.fetchLocallyByDefault.checked });
        this.fetchLocallyByDefault.checked
            ? this._hide(this.sitesToFetchLocallyEl)
            : this._show(this.sitesToFetchLocallyEl);
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    archiveByDefaultClick (e) {
        Object.assign(this.data, { ArchiveByDefault: this.archiveByDefault.checked });
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    allowExistCheckClick (e) {
        if (this.protocolCheck_.checked) {
            Object.assign(this.data, { AllowExistCheck: this.allowExistCheck.checked });
            this.port.postMessage({ request: 'setup-save', data: this.data });
        } else {
            this.allowExistCheck.checked = false;
            this.httpsMessage.classList.add('active');
        }
    }

    debugClick () {
        Object.assign(this.data, { Debug: this.debugEl.checked });
        this.port.postMessage({ request: 'setup-save', data: this.data });
    }

    wallabagApiTokenGot () {
        this.allowExistTextMessage();
        this._green(this.clientId_);
        this._green(this.clientSecret_);
        this._green(this.userLogin_);
        this._green(this.userPassword_);
        this._textSuccess(this.tokenLabel_);
        this.tokenLabel_.textContent = Common.translate('Granted');
    }

    _getUnit (value, key, locale) {
        switch (locale) {
            case 'ru': {
                const declension = value % 10;
                return (value <= 14 && value >= 11) ? Common.translate(`${key}_many`) : declension === 1 ? Common.translate(`${key}_one`) : declension < 5 ? Common.translate(`${key}_few`) : Common.translate(`${key}_many`);
            }
            default:
                return value > 1 ? Common.translate(`${key}_many`) : Common.translate(`${key}_one`);
        }
    }

    wallabagApiTokenNotGot () {
        this._red(this.clientId_);
        this._red(this.clientSecret_);
        this._red(this.userLogin_);
        this._red(this.userPassword_);
        this.tokenLabel_.textContent = Common.translate('Not_granted');
    }

    getAppTokenClick (e) {
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
            this.port.postMessage({ request: 'setup-gettoken', data: this.data });
        }
    }

    setDataFromFields () {
        Object.assign(this.data, {
            Url: this.protocolLabel_.textContent + this.cleanStr(this.wallabagurlinput_.value),
            ClientId: this.cleanStr(this.clientId_.value),
            ClientSecret: this.cleanStr(this.clientSecret_.value),
            UserLogin: this.cleanStr(this.userLogin_.value),
            UserPassword: this.userPassword_.value
        });
    }

    handleProtocolClick () {
        if (this.protocolCheck_.checked) {
            this.protocolLabel_.textContent = 'https://';
        } else {
            this.protocolLabel_.textContent = 'http://';
            this.allowExistCheck.checked = false;
        }
    }

    _hide (element) {
        element.classList.add('d-hide');
    }

    _show (element) {
        element.classList.remove('d-hide');
    }

    _green (element) {
        element.classList.remove('is-error');
        element.classList.add('is-success');
    }

    _red (element) {
        element.classList.add('is-error');
        element.classList.remove('is-success');
    }

    _textSuccess (element) {
        element.classList.remove('text-error');
        element.classList.add('text-success');
    }

    _textError (element) {
        element.classList.add('text-error');
        element.classList.remove('text-success');
    }

    wallabagUrlChecked () {
        if (this.data.ApiVersion) {
            this.allowExistTextMessage();
            this.versionLabel_.textContent = this.data.ApiVersion;
            if (this.data.ApiVersion.split('.')[0] === '2') {
                this._textSuccess(this.checkedLabel_);
                this.checkedLabel_.textContent = Common.translate('Ok');
                this._green(this.wallabagurlinput_);
                [...document.querySelectorAll('[data-wallabag-url]')].map(el => {
                    const href = this.data.Url + el.dataset.wallabagUrl;
                    el.href = href;
                    el.innerText = href;
                    return el;
                });
            }
        }
    }

    wallabagUrlNotChecked () {
        this._red(this.wallabagurlinput_);
        this._hide(this.tokenSection_);
        this._hide(this.togglesSection);
        this.checkedLabel_.textContent = Common.translate('Not_checked');
        this.permissionLabel_.textContent = Common.translate('Not_checked');
        this.versionLabel_.textContent = Common.translate('Not_checked');
    }

    async checkUrlClick (e) {
        e.preventDefault();
        this.clearMessage(this.checkUrlMessage_);
        this.clientSelector.clear();
        const urlDirty = this._getUrl();
        if (urlDirty !== '') {
            this._setProtocolCheck(urlDirty);
            this._setUrlInput(urlDirty);
            const url = this.protocolLabel_.textContent + this._getUrl();
            if (url !== this.data.Url) this.data.isFetchPermissionGranted = false;
            if (this.data.isFetchPermissionGranted !== true) {
                const granted = await new Promise((resolve, reject) => {
                    browser.permissions.request({
                        origins: [url + '/*']
                    }, resolve);
                }).then(granted => granted);
                this.data.isFetchPermissionGranted = granted;
                this.permissionLabelChecked();
            }
            if (this.data.isFetchPermissionGranted === true) {
                Object.assign(this.data, { Url: url });
                await this.autoFillApiToken();
                this.port.postMessage({ request: 'setup-checkurl', data: this.data });
            }
        }
    }

    async autoFillApiToken () {
        // @TODO extract these URLs to wallabag-api.js
        const urls = {
            developer: this.data.Url + '/developer',
            clientCreate: this.data.Url + '/developer/client/create',
            login: this.data.Url + '/login'
        };

        this.clientSelector.containerElement.innerHTML = '<div class="loading"></div>';

        const result = await fetch(urls.developer, { redirect: 'manual' });
        if (result.status === 200) {
            const html = await result.text();
            const parser = new DOMParser();
            const wallabagDeveloperDocument = parser.parseFromString(html, 'text/html');
            const clients = [...wallabagDeveloperDocument.getElementsByClassName('collapsible-body')].map(client => {
                const info = [...client.getElementsByTagName('code')].map(info => info.innerText);
                return {
                    name: client.parentElement.getElementsByClassName('collapsible-header')[0].innerText,
                    id: info[0],
                    secret: info[1]
                };
            });
            if (clients.length > 0) {
                const onOptionSelected = (clientIdValue, clientSecretValue) => {
                    this.clientId_.value = clientIdValue;
                    this.clientId_.disabled = true;
                    this.clientSecret_.value = clientSecretValue;
                    this.clientSecret_.disabled = true;
                    this._show(this.tokenSection_);
                    this._show(this.togglesSection);
                };
                this.clientSelector.set(clients, onOptionSelected);
            } else {
                this.setMessage(this.checkUrlMessage_, Common.translate(`First, you need to create <a href="${urls.clientCreate}" target="_blank">a new client</a>. Then you need to try again.`));
            }
        } else {
            this.setMessage(this.checkUrlMessage_, Common.translate(`You need to be logged in <a href="${urls.login}" target="_blank">your wallabag</a>. Then you need to try again.`));
        }
    }

    setMessage (el, content) {
        el.innerHTML = content;
    }

    clearMessage (el) {
        el.innerHTML = '';
    }

    permissionLabelChecked () {
        const granted = this.data.isFetchPermissionGranted;
        const permissionMethod = granted ? '_textSuccess' : '_textError';
        const permissionKey = granted ? 'Agreed' : 'Denied';
        this[permissionMethod](this.permissionLabel_);
        this.permissionLabel_.textContent = Common.translate(permissionKey);
        if (granted === false) {
            this._red(this.wallabagurlinput_);
            this._show(this.permissionText_);
        } else {
            this._hide(this.permissionText_);
        }
    }

    _urlSanitized (urlDirty) {
        const url = this.cleanStr(urlDirty)
            .replace(/^http(s?):\/\//gm, '')
            .replace(/login(\/?)$/gm, '')
            .replace(/developer(\/?)$/gm, '')
            .replace(/\/$/, '');
        return url;
    }

    _setProtocolCheck (url) {
        const re = /^(http|https):\/\/(.*)/;
        if (re.test(url)) {
            const res = re.exec(url);
            this.protocolCheck_.checked = (res[1] === 'https');
            this.protocolLabel_.textContent = res[1] + '://';
        };
    }

    _getUrl () {
        return this.wallabagurlinput_.value;
    }

    _setUrlInput (urlDirty) {
        this.wallabagurlinput_.value = this._urlSanitized(urlDirty) || '';
    }

    _setClientIdInput (clientId) {
        this.clientId_.value = typeof (clientId) === 'string' ? this.cleanStr(clientId) : '';
    }

    _setClientSecretInput (clientSecret) {
        this.clientSecret_.value = typeof (clientSecret) === 'string' ? this.cleanStr(clientSecret) : '';
    }

    _setUserLoginInput (userLogin) {
        this.userLogin_.value = typeof (userLogin) === 'string' ? this.cleanStr(userLogin) : '';
    }

    _setUserPasswordInput (userPassword) {
        this.userPassword_.value = userPassword || '';
    }

    cleanStr (strDirty) {
        return strDirty.trim();
    }

    setFields () {
        const urlDirty = this.data.Url;
        if (typeof (urlDirty) === 'string' && urlDirty.length > 0) {
            this._setProtocolCheck(urlDirty);
            this._setUrlInput(urlDirty);
        }

        if (this.wallabagurlinput_.value !== '') {
            this._show(this.tokenSection_);
            this._show(this.togglesSection);
        }
        this.wallabagUrlChecked();
        if (this.data.isFetchPermissionGranted) {
            this.permissionLabelChecked();
        } else {
            this._red(this.wallabagurlinput_);
            this._show(this.permissionText_);
        }

        this._setClientIdInput(this.data.ClientId);
        this._setClientSecretInput(this.data.ClientSecret);
        this._setUserLoginInput(this.data.UserLogin);
        this._setUserPasswordInput(this.data.UserPassword);

        if (this.data.ApiToken) {
            this._textSuccess(this.tokenLabel_);
            this.tokenLabel_.textContent = Common.translate('Granted');
        }

        if (this.data.isFetchPermissionGranted && this.data.isTokenExpired) {
            this._textError(this.tokenLabel_);
            this.tokenLabel_.textContent = Common.translate('Expired');
        }

        this.allowSpaceCheck.checked = this.data.AllowSpaceInTags;

        this.allowExistCheck.checked = this.data.AllowExistCheck;

        this.autoAddSingleTag.checked = this.data.AutoAddSingleTag;
        this.debugEl.checked = this.data.Debug;

        this.archiveByDefault.checked = this.data.ArchiveByDefault;

        this.fetchLocallyByDefault.checked = this.data.FetchLocallyByDefault;
        if (this.data.FetchLocallyByDefault) {
            this._hide(this.sitesToFetchLocallyEl);
        }
        this.setSitesToFetchLocallyUi();
    }

    setSitesToFetchLocallyUi () {
        const inputElement = document.getElementById('sites-to-fetch-locally-add-input');
        const listElement = document.getElementById('sites-to-fetch-locally-add-list');
        const form = document.getElementById('sites-to-fetch-locally-add-form');

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const sites = getSites();
            sites.add(inputElement.value);
            Object.assign(this.data, { sitesToFetchLocally: [...sites].join('\n') });
            setList(listElement, inputElement.value);
            inputElement.value = '';
            this.port.postMessage({ request: 'setup-save', data: this.data });
        }.bind(this));

        const getSites = () => {
            if (!this.data.sitesToFetchLocally) {
                return new Set();
            }
            return new Set(this.data.sitesToFetchLocally.split('\n'));
        };

        const setList = (listElement, lastItemAdded) => {
            const sites = [...getSites()].sort();
            listElement.innerHTML = '';
            if (sites.length === 0) {
                return false;
            }
            sites.forEach(site => {
                addItemElement(site, listElement, lastItemAdded);
            });
        };

        const addItemElement = (itemValue, listElement, lastItemAdded) => {
            const itemElement = document.createElement('li');
            itemElement.classList.add('sites-list-item');
            itemElement.dataset.url = itemValue;
            if (lastItemAdded === itemValue) {
                itemElement.classList.add('text-success');
            }

            const removeIcon = document.createElement('i');
            removeIcon.classList.add('icon', 'icon-delete');

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.title = Common.translate('Remove_site');
            removeButton.classList.add('btn');
            removeButton.addEventListener('click', function () {
                const sites = getSites();
                sites.delete(itemElement.dataset.url);
                Object.assign(this.data, { sitesToFetchLocally: [...sites].join('\n') });
                setList(listElement, inputElement.value);
                this.port.postMessage({ request: 'setup-save', data: this.data });
            }.bind(this));

            const textElement = document.createElement('span');
            textElement.innerText = itemValue;

            removeButton.appendChild(removeIcon);
            itemElement.appendChild(removeButton);
            itemElement.appendChild(textElement);
            listElement.appendChild(itemElement);
        };

        setList(listElement);
    }

    allowExistTextMessage () {
        const allowExistTextToShow = this.data.AllowExistSafe === false
            ? this.allowExistInsecureText
            : this.allowExistSecureText;
        const allowExistTextToHide = this.data.AllowExistSafe === true
            ? this.allowExistInsecureText
            : this.allowExistSecureText;
        this._hide(allowExistTextToHide);
        this._show(allowExistTextToShow);
    }

    messageListener (msg) {
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
                    this.wallabagUrlChecked();
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
                if (this.data !== null && this.data.Debug) {
                    console.log(`unknown message: ${msg}`);
                }
        };
    }

    connectPort () {
        this.port = browser.runtime.connect({ name: 'setup' });

        this.port.onMessage.addListener(this.messageListener.bind(this));

        this.port.onDisconnect.addListener(() => {
            console.warn('Port disconnected, attempting to reconnect...');
            setTimeout(this.connectPort.bind(this), 1000); // Retry after 1 second
        });
    }

    init () {
        this.connectPort();
        this.port.postMessage({ request: 'setup' });
    }
}

class ClientSelector {
    constructor (containerElement) {
        this.containerElement = containerElement;
    }

    set (clients, onOptionSelected) {
        const selectElement = document.createElement('select');
        selectElement.id = 'client-selector';
        selectElement.classList.add('form-select');
        selectElement.addEventListener('change', function (event) {
            const clientId = event.target.value;
            const clientSecret = clients.find(client => client.id === clientId).secret;
            onOptionSelected(clientId, clientSecret);
        });

        const initialOption = document.createElement('option');
        initialOption.text = Common.translate('Pick_a_client');
        initialOption.selected = true;
        initialOption.disabled = true;
        selectElement.appendChild(initialOption);

        clients.forEach(client => {
            const option = document.createElement('option');
            option.text = client.name;
            option.value = client.id;
            selectElement.appendChild(option);
        });
        this.clear();
        this.containerElement.appendChild(selectElement);
    }

    clear () {
        this.containerElement.innerHTML = '';
    }
}

Common.translateAll();
const PC = new OptionsController();
PC.init();
