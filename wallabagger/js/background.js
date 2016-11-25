if(typeof(browser) === 'undefined' && typeof(chrome) === 'object') {
    browser = chrome;
}
let browserActionIconDefault = browser.runtime.getManifest().browser_action.default_icon;

browser.contextMenus.create({
    id: "wallabagger-add-link",
    title: "Wallabag it!",
    contexts: ["link"]
});

browser.contextMenus.onClicked.addListener(function(info) {
    switch (info.menuItemId) {
        case "wallabagger-add-link":
            browser.browserAction.setIcon({path: 'img/wallabagger-yellow.svg'});
            this.api =  new WallabagApi();
              let apiAuthorised = this.api.load()
                     .then(data =>{
                        if ( this.api.needNewAppToken() ){
                            return this.api.GetAppToken();
                        }
                        return 'OK'               
                    })
                    .catch(error=>{
                            throw error;    
                   });
              
                    apiAuthorised
                    .then(() => {
                        if( ! this.api.SavePage(info.linkUrl) ) {
                            browser.browserAction.setIcon({path: 'img/wallabagger-red.svg'});
                        }
                        browser.browserAction.setIcon({path: 'img/wallabagger-green.svg'});
                        setTimeout(function() {
                            browser.browserAction.setIcon({path: browserActionIconDefault});
                        }, 5000);
                    })
            break;
    }
});
