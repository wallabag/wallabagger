var PopupController = function () {
    this.mainCard = document.getElementById('main-card');
    this.errorToast = document.getElementById('error-toast');
    this.infoToast = document.getElementById('info-toast');
    this.cardTitle = document.getElementById('card-title');
    this.entryUrl = document.getElementById('entry-url');
    this.cardImage = document.getElementById('card-image');
    this.tagsInputContainer = document.getElementById('tags-input-container');
    this.tagsInput = document.getElementById('tags-input');
    this.tagsAutoCompleteList = document.getElementById('tags-autocomplete-list');
    this.editIcon = document.getElementById('edit-icon');
    this.saveTitleButton = document.getElementById('save-title-button');
    this.cancelTitleButton = document.getElementById('cancel-title-button');
    this.deleteIcon = document.getElementById('delete-icon');
    this.closeConfirmation = document.getElementById('close-confirmation');
    this.cancelConfirmation = document.getElementById('cancel-confirmation');
    this.deleteArticleButton = document.getElementById('delete-article');
    this.archivedIcon = document.getElementById('archived-icon');
    this.deleteConfirmationCard = document.getElementById('delete_confirmation');
    this.titleInput = document.getElementById('title-input');
    this.cardHeader = document.getElementById('card-header');
    this.cardBody = document.getElementById('card-body');
    this.starredIcon = document.getElementById('starred-icon');
    this.articleId = -1;
    this.addListeners();
};

PopupController.prototype = {

    mainCard: null,
    errorToast: null,
    infoToast: null,
    apiUrl: null,
    entryUrl: null,
    cardTitle: null,
    cardImage: null,
    tagsInputContainer: null,
    tagsInput: null,
    tagsAutoCompleteList: null,

    articleId: null,
    editIcon: null,
    saveTitleButton: null,
    cancelTitleButton: null,
    deleteIcon: null,
    closeConfirmation: null,
    cancelConfirmation: null,
    deleteArticleButton: null,
    archivedIcon: null,
    deleteConfirmationCard: null,
    titleInput: null,
    cardHeader: null,
    cardBody: null,

    starredIcon: null,

    articleTags: [],
    allTags: [],
    dirtyTags: [],
    foundTags: [],

    starred: false,
    archived: false,
    tmpTagId: 0,
    AllowSpaceInTags: false,
    tabUrl: null,

    port: null,

    getSaveHtml: function (param) {
        let map = { '&': '&amp;', '\'': '&#039;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
        return param.replace(/[<'&">]/g, symb => map[symb]);
    },

    addListeners: function () {
        this.cardTitle.addEventListener('click', this.cardTitleClick);
        this.entryUrl.addEventListener('click', this.entryUrlClick);
        this.editIcon.addEventListener('click', this.editIconClick.bind(this));
        this.saveTitleButton.addEventListener('click', this.saveTitleClick.bind(this));
        this.cancelTitleButton.addEventListener('click', this.cancelTitleClick.bind(this));

        this.deleteIcon.addEventListener('click', this.deleteConfirmation.bind(this));
        this.closeConfirmation.addEventListener('click', this.cancelDelete.bind(this));
        this.cancelConfirmation.addEventListener('click', this.cancelDelete.bind(this));
        this.deleteArticleButton.addEventListener('click', this.deleteArticle.bind(this));

        this.tagsInput.addEventListener('input', this.onTagsInputChanged.bind(this));
        this.tagsInput.addEventListener('keyup', this.onTagsInputKeyUp.bind(this));

        this.starredIcon.addEventListener('click', this.onIconClick.bind(this));
        this.archivedIcon.addEventListener('click', this.onIconClick.bind(this));
    },

    onIconClick: function (event) {
        event.preventDefault();
        let icon = event.currentTarget;
        this.toggleIcon(icon);
        this.toggleAction(icon);
        this.setIconTitle(icon);
        this.tagsInput.focus();
    },

    toggleIcon: function (icon) {
        let currentState = JSON.parse(icon.dataset.isset);

        icon.classList.remove(currentState ? icon.dataset.seticon : icon.dataset.unseticon);
        icon.classList.add(currentState ? icon.dataset.unseticon : icon.dataset.seticon);

        currentState = !currentState;
        icon.dataset.isset = JSON.stringify(currentState);
    },

    setIconTitle: function (icon) {
        icon.title = icon.dataset.isset ? icon.dataset.unseticonTitle : icon.dataset.seticonTitle;
    },

    toggleAction: function (icon) {
        this.port.postMessage({request: icon.dataset.apicall, articleId: this.articleId, value: icon.dataset.isset, tabUrl: this.tabUrl});
    },

    onTagsInputKeyUp: function (event) {
        if (event.key === 'ArrowRight') this.addFirstFoundTag();
        if ((event.key === 'Enter') && (this.AllowSpaceInTags)) {
            this.addTag(this.tmpTagId, this.tagsInput.value.trim());
        };
    },

    disableTagsInput: function () {
        this.foundTags.length = 0;
        this.tagsInput.value = '';
        this.tagsInput.placeholder = 'saving tags....';
        this.tagsInput.disabled = true;
    },

    enableTagsInput: function () {
        this.tagsInput.placeholder = 'type tags here';
        this.tagsInput.disabled = false;
        this.tagsInput.focus();
    },

    onFoundTagChipClick: function (event) {
        this.addTag(event.currentTarget.dataset.tagid, event.currentTarget.dataset.taglabel);
        event.currentTarget.parentNode.removeChild(event.currentTarget);
    },

    addFirstFoundTag: function () {
        if (this.foundTags.length > 0) {
            this.addTag(this.foundTags[0].id, this.foundTags[0].label);
        }
    },

    addTag: function (tagid, taglabel) {
        this.disableTagsInput();
        if (this.articleTags.concat(this.dirtyTags).map(t => t.label.toUpperCase()).indexOf(taglabel.toUpperCase()) === -1) {
            this.dirtyTags.push({
                id: tagid,
                label: taglabel,
                slug: taglabel
            });
            this.tagsInputContainer.insertBefore(
                this.createTagChip(tagid, taglabel),
                this.tagsInput);
            this.enableTagsInput();
            if (tagid <= 0) {
                this.tmpTagId = this.tmpTagId - 1;
            }
            this.port.postMessage({request: 'saveTags', articleId: this.articleId, tags: this.getSaveHtml(this.getTagsStr()), tabUrl: this.tabUrl});
            this.checkAutocompleteState();
        } else {
            this.tagsInput.placeholder = 'Duplicate tag!!!';
            var self = this;
            setTimeout(function () { self.enableTagsInput(); }, 1000);
        }
    },

    deleteTag: function (ev) {
        let chip = ev.currentTarget.parentNode;
        let tagid = chip.dataset.tagid;
        this.dirtyTags = this.dirtyTags.filter(tag => tag.id !== tagid);
        chip.parentNode.removeChild(chip);
        this.port.postMessage({request: 'deleteArticleTag', articleId: this.articleId, tagId: tagid, tags: this.getSaveHtml(this.getTagsStr()), tabUrl: this.tabUrl});
        this.checkAutocompleteState();
        this.tagsInput.focus();
    },

    getTagsStr: function () {
        return Array.prototype.slice.call(this.tagsInputContainer.childNodes)
             .filter(e => (e.classList != null) && e.classList.contains('chip-sm'))
             .map(e => e.dataset.taglabel).join(',');
    },

    clearAutocompleteList: function () {
        this.foundTags.length = 0;

        Array.prototype.slice.call(this.tagsAutoCompleteList.childNodes)
         .filter(e => (e.classList != null) && e.classList.contains('chip-sm'))
         .map(e => this.tagsAutoCompleteList.removeChild(e));
    },

    findTags: function (search) {
        this.foundTags = this.allTags.filter(tag => (this.articleTags.concat(this.dirtyTags).map(t => t.id).indexOf(tag.id) === -1) &&
            (this.tagsInput.value.length >= 3 &&
            tag.label.toUpperCase().indexOf(this.tagsInput.value.toUpperCase()) !== -1) ||
            (this.tagsInput.value === tag.label) &&
            (this.articleTags.concat(this.dirtyTags).map(t => t.label).indexOf(this.tagsInput.value) === -1)
        );

        this.foundTags.map(tag => this.tagsAutoCompleteList.appendChild(this.createTagChipNoClose(tag.id, tag.label)));
    },

    checkAutocompleteState: function () {
        if (this.foundTags.length > 0) {
            this.mainCard.classList.add('pb-30');
            this.show(this.tagsAutoCompleteList);
        } else {
            this.mainCard.classList.remove('pb-30');
            this.hide(this.tagsAutoCompleteList);
        }
    },

    onTagsInputChanged: function (e) {
        e.preventDefault();
        this.clearAutocompleteList();
        if (this.tagsInput.value !== '') {
            const lastChar = this.tagsInput.value.slice(-1);
            const value = this.tagsInput.value.slice(0, -1);
            if ((lastChar === ',') || (lastChar === ';') || ((lastChar === ' ') && (!this.AllowSpaceInTags))) {
                if (value !== '') {
                    this.addTag(this.tmpTagId, this.tagsInput.value.slice(0, -1));
                }
                this.tagsInput.value = '';
            } else {
                this.findTags(this.tagsInput.value);
            }
        }
        this.checkAutocompleteState();
    },

    deleteArticle: function (e) {
        e.preventDefault();
        this.port.postMessage({ request: 'deleteArticle', articleId: this.articleId, tabUrl: this.tabUrl });
        this.deleteConfirmationCard.classList.remove('active');
        window.close();
    },

    cancelDelete: function (e) {
        e.preventDefault();
        this.deleteConfirmationCard.classList.remove('active');
    },

    deleteConfirmation: function (e) {
        e.preventDefault();
        this.deleteConfirmationCard.classList.add('active');
    },

    editIconClick: function (e) {
        e.preventDefault();
        this.titleInput.value = this.cardTitle.textContent;
        this.hide(this.cardHeader);
        this.show(this.cardBody);
    },

    saveTitleClick: function (e) {
        e.preventDefault();
        this.port.postMessage({request: 'saveTitle', articleId: this.articleId, title: this.getSaveHtml(this.titleInput.value), tabUrl: this.tabUrl});
        this.cardTitle.textContent = this.titleInput.value;
        this.hide(this.cardBody);
        this.show(this.cardHeader);
    },

    cancelTitleClick: function (e) {
        e.preventDefault();
        this.hide(this.cardBody);
        this.show(this.cardHeader);
        this.tagsInput.focus();
    },

    cardTitleClick: function (e) {
        e.preventDefault();
        window.close();
        browser.tabs.create({url: this.href});
    },

    entryUrlClick: function (e) {
        e.preventDefault();
        window.close();
        browser.tabs.create({url: this.href});
    },

    activeTab: function () {
        return new Promise((resolve, reject) => {
            browser.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
                if (tabs[0] != null) {
                    return resolve(tabs[0]);
                } else {
                    return reject('active tab not found');
                }
            });
        });
    },

    _createContainerEl: function (id, label) {
        const container = document.createElement('div');
        container.setAttribute('class', 'chip-sm');
        container.setAttribute('data-tagid', id);
        container.setAttribute('data-taglabel', label);
        container.appendChild(this._createTagEl(label));
        return container;
    },

    _createTagEl: (label) => {
        const tag = document.createElement('span');
        tag.setAttribute('class', 'chip-name');
        tag.textContent = label;
        return tag;
    },

    createTagChip: function (id, label) {
        const container = this._createContainerEl(id, label);

        const button = document.createElement('button');
        button.setAttribute('class', 'btn btn-clear');
        button.addEventListener('click', this.deleteTag.bind(this));

        container.appendChild(button);

        return container;
    },

    createTagChipNoClose: function (id, label) {
        const container = this._createContainerEl(id, label);
        container.addEventListener('click', this.onFoundTagChipClick.bind(this));
        container.setAttribute('style', 'cursor: pointer;');
        return container;
    },

    clearTagInput: function () {
        let tagsA = Array.prototype.slice.call(this.tagsInputContainer.childNodes);
        return tagsA.filter(e => (e.classList != null) && e.classList.contains('chip-sm'))
                    .map(e => { this.tagsInputContainer.removeChild(e); return 0; });
    },

    createTags: function (data) {
        this.articleTags = data;
        this.dirtyTags = this.dirtyTags.filter(tag => this.articleTags.filter(atag => atag.label.toLowerCase() === tag.label.toLowerCase()).length === 0);
        this.clearTagInput();
        this.articleTags.concat(this.dirtyTags).map(tag => {
            this.tagsInputContainer.insertBefore(this.createTagChip(tag.id, tag.label), this.tagsInput);
        });
    },

    setArticle: function (data) {
        this.articleId = data.id;
        if (data.title !== undefined) { this.cardTitle.textContent = data.title; }
        this.cardTitle.href = data.id === -1 ? '#' : `${this.apiUrl}/view/${this.articleId}`;
        if (data.domain_name !== undefined) { this.entryUrl.textContent = data.domain_name; }
        this.entryUrl.href = data.url;

        if (typeof (data.preview_picture) === 'string' &&
            data.preview_picture.length > 0 &&
            data.preview_picture.indexOf('http') === 0) {
            this.cardImage.src = data.preview_picture;
        } else {
            this.hide(this.cardImage);
        }

        if (data.is_starred !== undefined) { this.starred = data.is_starred; }
        this.setIconTitle(this.starredIcon, this.starred);
        if (this.starred) {
            this.toggleIcon(this.starredIcon);
        }
        if (data.is_archived !== undefined) { this.archived = data.is_archived; }
        this.setIconTitle(this.archivedIcon, this.archived);
        if (this.archived) {
            this.toggleIcon(this.archivedIcon);
        }
        if (data.id === -1 && data.tagList !== undefined) {
            this.dirtyTags = data.tagList.split(',').map(taglabel => {
                this.tmpTagId = this.tmpTagId - 1;
                return {
                    id: this.tmpTagId,
                    label: taglabel,
                    slug: taglabel
                };
            });
            this.createTags([]);
        } else {
            this.createTags(data.tags);
        }
        this.enableTagsInput();
    },

    messageListener: function (msg) {
        switch (msg.response) {
            case 'info':
                this.showInfo(msg.text);
                break;
            case 'error':
                this.hide(this.infoToast);
                this.hide(this.mainCard);
                this.showError(msg.error.message);
                break;
            case 'article':
                this.hide(this.infoToast);
                if (msg.article !== null) {
                    this.setArticle(msg.article);
                    this.hide(this.infoToast);
                    this.show(this.mainCard);
                } else {
                    this.showError('Error: empty data!');
                }
                break;
            case 'tags':
                this.allTags = msg.tags;
                break;
            case 'title':
                this.cardTitle.innerHTML = msg.title;
                break;
            case 'setup':
                this.AllowSpaceInTags = msg.data.AllowSpaceInTags;
                this.apiUrl = msg.data.Url;
                break;
            case 'articleTags':
                this.createTags(msg.tags);
                break;
            case 'action':
                this.archived = msg.value.archived;
                this.starred = msg.value.starred;
                break;
            default:
                console.log(`unknown message: ${msg}`);
        };
    },

    init: function () {
        this.port = browser.runtime.connect({name: 'popup'});
        this.port.onMessage.addListener(this.messageListener.bind(this));
        this.port.postMessage({request: 'setup'});
        this.activeTab().then(tab => {
            this.tabUrl = tab.url;
            this.cardTitle.textContent = tab.title;
            this.entryUrl.textContent = /(\w+:\/\/)([^/]+)\/(.*)/.exec(tab.url)[2];
            this.enableTagsInput();
            this.port.postMessage({request: 'save', tabUrl: tab.url});
        });
        this.port.postMessage({request: 'tags'});
    },

    showError: function (infoString) {
        this.errorToast.textContent = infoString;
        this.show(this.errorToast);
    },

    showInfo: function (infoString) {
        this.infoToast.textContent = infoString;
        this.show(this.infoToast);
    },

    hide: function (element) {
        element.classList.add('hide');
    },

    show: function (element) {
        element.classList.remove('hide');
    }

};

document.addEventListener('DOMContentLoaded', function () {
    if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
        browser = chrome;
    }
    const PC = new PopupController();
    PC.init();
});
