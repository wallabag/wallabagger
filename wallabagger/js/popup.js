var PopupController = function () {

    this.mainCard   = document.getElementById("main-card");
    this.errorToast = document.getElementById("error-toast");
    this.infoToast  = document.getElementById("info-toast");
    this.cardTitle  = document.getElementById("card-title");
    this.cardMeta   = document.getElementById("card-meta");
    this.cardImage  = document.getElementById("card-image");
    this.tagsInputContainer  = document.getElementById("tags-input-container");
    this.tagsInput  = document.getElementById("tags-input");
    this.tagsAutoCompleteList  = document.getElementById("tags-autocomplete-list");
    this.editIcon = document.getElementById("edit-icon");
    this.saveTitleButton = document.getElementById("save-title-button");
    this.cancelTitleButton = document.getElementById("cancel-title-button");
    this.deleteIcon = document.getElementById("delete-icon")
    this.closeConfirmation = document.getElementById("close-confirmation");
    this.cancelConfirmation = document.getElementById("cancel-confirmation");
    this.deleteArticleButton = document.getElementById("delete-article");
    this.setStarredIcon = document.getElementById("set-starred");
    this.removeStarredIcon = document.getElementById("remove-starred");
    this.setArchivedIcon = document.getElementById("set-archived");
    this.removeArchivedIcon = document.getElementById("remove-archived");
    this.deleteConfirmationCard = document.getElementById("delete_confirmation");
    this.titleInput = document.getElementById("title-input");
    this.cardHeader   = document.getElementById("card-header");
    this.cardBody   = document.getElementById("card-body");

    this.addListeners();

};

PopupController.prototype = {

    mainCard: null,
    errorToast: null,
    infoToast: null,
    cardMeta: null,
    cardTitle: null,
    cardImage: null,
    tagsInputContainer: null,
    tagsInput: null,
    tagsAutoCompleteList: null,

    wallabagUrl: null,    
    appToken: null,
    refreshToken: null,
    tokenExpireDate: null,

    articleId: null,
    originalLink: null,
    api: null,
    editIcon: null,
    saveTitleButton: null,
    cancelTitleButton: null,
    deleteIcon: null,
    closeConfirmation: null,
    cancelConfirmation: null,
    deleteArticleButton: null,
    setStarredIcon: null,
    removeStarredIcon: null,
    setArchivedIcon: null,
    removeArchivedIcon: null,
    deleteConfirmationCard: null,
    titleInput: null,
    cardHeader: null,
    cardBody: null,


    articleTags: [],
    foundTags: [],
    
    starred: false,
    archived: false,

    saveHtml: function (param) {
        let map = { '&'  : '&amp;', '\'' : '&#039;', '\"' : '&quot;', '<'  : '&lt;', '>'  : '&gt;'  };
        return param.replace(/[<'&">]/g, symb => map[symb]); 
    },

    addListeners: function () {
        
        this.cardTitle.addEventListener('click', this.cardTitleClick.bind(this));
        this.cardMeta.addEventListener('click', this.cardMetaClick.bind(this));
        this.editIcon.addEventListener('click', this.editIconClick.bind(this));
        this.saveTitleButton.addEventListener('click', this.saveTitleClick.bind(this));
        this.cancelTitleButton.addEventListener('click', this.cancelTitleClick.bind(this));
        this.deleteIcon.addEventListener('click', this.deleteConfirmation.bind(this));
        this.closeConfirmation.addEventListener('click', this.cancelDelete.bind(this));
        this.cancelConfirmation.addEventListener('click', this.cancelDelete.bind(this));
        this.deleteArticleButton.addEventListener('click', this.deleteArticle.bind(this));
        this.setStarredIcon.addEventListener('click', this.setStarred.bind(this));
        this.removeStarredIcon.addEventListener('click', this.removeStarred.bind(this));
        this.setArchivedIcon.addEventListener('click', this.setArchived.bind(this));
        this.removeArchivedIcon.addEventListener('click', this.removeArchived.bind(this));
        
        this.tagsInput.addEventListener('input',this.TagsInputChanged.bind(this));
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
    
    addTag: function (ev) {
//        alert(ev.currentTarget.dataset.tagid);
        this.tagsInputContainer.insertBefore(
            this.createTagChip( 
                ev.currentTarget.dataset.tagid, 
                ev.currentTarget.dataset.taglabel ),this.tagsInput);
        ev.currentTarget.parentNode.removeChild(ev.currentTarget);

        this.disableTagsInput();

        this.api.SaveTags(this.articleId, this.saveHtml( this.getTagsStr() ))
        .then( data => this.loadArticleTags(data) )
        .then(data => this.enableTagsInput())
        .catch(error=>{
            this.hide(this.infoToast);
            this.showError(error.message);
            })

        this.checkAutocompleteState();
          
    },

    deleteTag: function (ev) {
    //    alert(ev.currentTarget.dataset.tagid);
        let chip = ev.currentTarget.parentNode;
        let tagid = chip.dataset.tagid;
        
        chip.parentNode.removeChild(chip);

        this.disableTagsInput();
        
        this.api.DeleteArticleTag(this.articleId, tagid )
              .then( data => this.loadArticleTags(data) )
              .then(data => this.enableTagsInput() )
              .catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           })
           
           this.checkAutocompleteState();

    },

     getTagsStr: function(){
         return  Array.prototype.slice.call(this.tagsInputContainer.childNodes)
             .filter(e=> ( e.classList != null ) && e.classList.contains("chip-sm") )
             .map( e=> e.dataset.taglabel ).join(',');
     },
    
    ClearAutocompleteList: function () {

        this.foundTags.length = 0;

        Array.prototype.slice.call(this.tagsAutoCompleteList.childNodes)
         .filter(e=> ( e.classList != null ) && e.classList.contains("chip-sm") )
         .map( e => this.tagsAutoCompleteList.removeChild(e) );
    },
    
    findTags: function (search) {

        this.foundTags = this.api.tags.filter(tag => ( this.articleTags.map(t=>t.id).indexOf(tag.id) === -1 ) &&
            (this.tagsInput.value.length >= 3
                && tag.label.indexOf(this.tagsInput.value) != -1)
            || (this.tagsInput.value == tag.label) 
               && ( this.articleTags.map(t=>t.label).indexOf(this.tagsInput.value) === -1 )
        );
        
        this.foundTags.map(tag => this.tagsAutoCompleteList.appendChild(this.createTagChipNoClose(tag.id, tag.label)));

    },
    
    checkAutocompleteState: function () {

        if (this.foundTags.length > 0) {
            this.show(this.tagsAutoCompleteList);
        } else {
            this.hide(this.tagsAutoCompleteList);
        }
       
    },
    
    TagsInputChanged: function (e) {
        e.preventDefault();
        
        this.ClearAutocompleteList();
        
        if (this.tagsInput.value != '') {
            let lastChar = this.tagsInput.value.slice(-1)
            if ((lastChar == ',') || (lastChar == ';') || (lastChar == ' ')) {
                let tagStr = `${this.getTagsStr()},${this.tagsInput.value}`;

                
                if ( this.articleTags.map(t=>t.label).indexOf(this.tagsInput.value.slice(0, -1)) === -1 ) {
                
                    this.disableTagsInput();
                    
                    this.api.SaveTags(this.articleId, this.saveHtml( tagStr.slice(0, -1)))
                    .then( data => this.loadArticleTags(data) )
                    .then(data => this.enableTagsInput())
                    .catch(error=>{
                        this.hide(this.infoToast);
                        this.showError(error.message);
                        })
                        
                }
                else {
                  this.disableTagsInput();
                  this.tagsInput.placeholder = 'Duplicate tag!!!';
                  var self = this;
                  setTimeout(function(){ self.enableTagsInput(); }, 1000);
                }                
            }
            else this.findTags( this.tagsInput.value ); 
        }
        
        this.checkAutocompleteState();
           
    },
    
    setArchived:  function (e) {
        e.preventDefault();
        this.api.SaveArchived(this.articleId, true).then(d=>{
            this.starred = true; 
            this.show( this.removeArchivedIcon );
            this.hide( this.setArchivedIcon );
        }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
        //.catch(error=>{ console.log(error) });;
    },

    removeArchived:  function (e) {
        e.preventDefault();
        this.api.SaveArchived( this.articleId, false).then(d=>{
            this.starred = false; 
            this.hide( this.removeArchivedIcon);
            this.show( this.setArchivedIcon );
        }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
        //.catch(error=>{ console.log(error) });;
    },

    setStarred:  function (e) {
        e.preventDefault();
        this.api.SaveStarred(this.articleId, true).then(d=>{
            this.starred = true; 
            this.show( this.removeStarredIcon );
            this.hide( this.setStarredIcon );
        }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
        //.catch(error=>{ console.log(error) });;
    },

    removeStarred:  function (e) {
        e.preventDefault();
        this.api.SaveStarred(this.articleId, false).then(d=>{
            this.starred = false; 
            this.hide( this.removeStarredIcon );
            this.show( this.setStarredIcon );
        }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
        //.catch(error=>{ console.log(error) });;
    },

    
    deleteArticle:  function (e) {
        e.preventDefault();
        this.api.DeleteArticle(this.articleId)
            .then(data =>{ 
                this.deleteConfirmationCard.classList.remove('active');
                window.close(); 
            }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
            //.catch(error=>{ console.log(error) });
    },
    
    cancelDelete:  function (e) {
        e.preventDefault();
        this.deleteConfirmationCard.classList.remove('active');
    },
    
    deleteConfirmation:  function (e) {
        e.preventDefault();
        this.deleteConfirmationCard.classList.add('active');
    },
    
    editIconClick:  function (e) {
        e.preventDefault();
        this.titleInput.value = this.cardTitle.innerHTML;
        this.hide( this.cardHeader );
        this.show( this.cardBody );
    },
    
    saveTitleClick: function (e) {
        e.preventDefault();
        this.cardTitle.innerHTML = this.titleInput.value;
        this.api.SaveTitle(this.articleId, this.saveHtml( this.cardTitle.innerHTML) )
            .then(data => {
                this.hide( this.cardBody );
                this.show( this.cardHeader );
            })
            .catch(error => {
//                console.log(error)
                this.hide(this.infoToast);
                this.showError(error);
            });

    },

    cancelTitleClick:  function (e) {
        e.preventDefault();
        this.hide( this.cardBody );
        this.show( this.cardHeader );
    },

    
    cardTitleClick: function (e) {
        e.preventDefault();
        window.close();
        chrome.tabs.create({url: `${this.api.data.Url}/view/${this.articleId}`})
    },

    cardMetaClick: function (e) {
        e.preventDefault();
        window.close();
        chrome.tabs.create({url: this.originalLink})
    },


    activeTab: function () {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ 'active': true, 'currentWindow': true }, function( tabs ){
               if (tabs[0] != null) {
                   return resolve(tabs[0]);
               }
               else {
                   return reject('active tab not found');
               }
            })
        });
    },

    createTagChip: function(tagid,taglabel) {
        let element = document.createElement('div');
        element.innerHTML =`<div class="chip-sm" data-tagid="${tagid}" data-taglabel="${taglabel}"><span class="chip-name">${taglabel}</span><button class="btn btn-clear"></button></div>`;
        let chipClose = element.firstChild.lastChild;
        chipClose.addEventListener('click',this.deleteTag.bind(this));
        return element.firstChild;
                },

    createTagChipNoClose: function(tagid,taglabel) {
        let element = document.createElement('div');
        element.innerHTML =`<div class="chip-sm" data-tagid="${tagid}" data-taglabel="${taglabel}"" style="cursor: pointer;"><span class="chip-name">${taglabel}</span></div>`;
        element.firstChild.addEventListener('click',this.addTag.bind(this));
        return element.firstChild;        
                },

    clearTagInput:  function(){
         let tagsA = Array.prototype.slice.call(this.tagsInputContainer.childNodes);
         return tagsA.filter(e=> ( e.classList != null ) && e.classList.contains("chip-sm") )
                    .map( e=> { this.tagsInputContainer.removeChild(e); return 0; } );
    },
    
    createTags: function(data){
        this.articleTags = data;
        this.clearTagInput();
        return this.articleTags.map( tag => {
                    this.tagsInputContainer.insertBefore(this.createTagChip( tag.id, tag.label ),this.tagsInput);
                    return tag;
                }); 
        },
   
   loadArticleTags: function(data) {
       return this.api.GetArticleTags(this.articleId).then( data => this.createTags(data));
   },
   
    init: function(){
      this.api =  new WallabagApi();
      this.showInfo('Loading wallabag API...');

      let apiAuthorised = this.api.load()
             .then(data =>{
                if ( this.api.needNewAppToken() ){
                    this.showInfo('Obtaining wallabag api token...');
                    return this.api.GetAppToken();
                }
                return 'OK'               
            })
            .catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
                    throw error;    
           });
      
            apiAuthorised.then(data=> this.activeTab() )
            .then(tab => {
                this.showInfo('Saving the page to wallabag ...');
                console.log(tab.url);
                return this.api.SavePage(tab.url);                  
            })
            .then( data => {
                   console.log(data);
                    if (data != null){
                        this.cardTitle.innerHTML = data.title;
                        this.cardMeta.innerHTML = data.domain_name;
                        
                        if ((data.preview_picture!=null)&&(data.preview_picture!='')){
                            this.cardImage.src = data.preview_picture;
                        }
                        else
                        {
                            this.hide(this.cardImage);
                        }
                        
                        this.articleId = data.id;
                        this.originalLink = data.url;
                        this.starred = data.is_starred;
                        if ( this.starred ) { 
                            this.show( this.removeStarredIcon );
                            this.hide( this.setStarredIcon );
                        }
                        this.archived = data.is_archived;
                        if ( this.archived ) { 
                            this.show( this.removeArchivedIcon );
                            this.hide( this.setArchivedIcon );
                        }
                    }
                    this.hide(this.infoToast);
                    this.show(this.mainCard);                
            })
            .then( data => this.loadArticleTags(data) )
            .then(data => this.enableTagsInput())
            .catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
                
           // loading tags for addtags functionality     
           apiAuthorised.then( data => this.api.GetTags() )
        //    .then(tags => {
        //    tags.map(tag => {
        //        var element = document.createElement('option');
        //        element.value = tag.label;
        //        return element;
        //    }).map(element=>{
        //        document.getElementById("tag-list").appendChild(element);
        //        return element;
        //    })
        //    } )
           .catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
            
    },
    
    showError: function (infoString) {
        this.errorToast.innerText = infoString;
        this.show(this.errorToast);
    },

    showInfo: function (infoString) {
        this.infoToast.innerText = infoString;
        this.show(this.infoToast);
    },
    
    hide: function (element) {
        element.classList.add('hide');
    },
    
    show: function (element) {
        element.classList.remove('hide');
    },
    
}

document.addEventListener('DOMContentLoaded', function () {
    window.PC = new PopupController();
    PC.init();
});


                //this.hide(this.infoToast);
                // refresh token is_expired in wallabag api is WRONG! issue #2056
                // if ((data.ApiToken == '') || (data.ApiToken == null)) {
                //         this.showError('wallabag App token not loaded, check settings!');
                // }
                // if ( this.api.expired() ){
                //     this.showInfo('API token expired, refreshing ...');
                //     if ((this.api.data.RefreshToken == '') || (this.api.data.RefreshToken == null)) {
                //             this.showError('wallabag Refresh token not loaded, check settings!');
                //     } else {
                //       return  this.api.RefreshToken();
                //     }
                    
                // }
           
