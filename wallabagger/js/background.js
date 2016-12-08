if(typeof(browser) === 'undefined' && typeof(chrome) === 'object') {
    browser = chrome;
}
let browserActionIconDefault = browser.runtime.getManifest().browser_action.default_icon;

browser.contextMenus.create({
    id: "wallabagger-add-link",
    title: "Wallabag it!",
    contexts: ["link", "page"]
});

function savePageToWallabag(url) {

    browser.browserAction.setIcon({ path: 'img/wallabagger-yellow.svg' });
    this.api = new WallabagApi();
    let apiAuthorised = this.api.load()
        .then(data => {
            if (this.api.needNewAppToken()) {
                return this.api.GetAppToken();
            }
            return 'OK'
        })
        .catch(error => {
            throw error;
        });

    apiAuthorised.then(() => this.api.SavePage(url))
        .then(r => {
            browser.browserAction.setIcon({ path: 'img/wallabagger-green.svg' });
            setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
        })
        .catch(e => {
            browser.browserAction.setIcon({ path: 'img/wallabagger-red.svg' });
            setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
        });

};

browser.contextMenus.onClicked.addListener(function (info) {

    switch (info.menuItemId) {
        case "wallabagger-add-link":

            const url = typeof (info.linkUrl) === 'string' ? info.linkUrl : info.pageUrl;

            savePageToWallabag(url);

            break;
    }

});


browser.commands.onCommand.addListener(function (command) {

    if (command == "wallabag-it") {
        chrome.tabs.query({ 'active': true }, function (tabs) {
            if (tabs[0] != null) {
                savePageToWallabag(tabs[0].url);
            }
        });
    }

});