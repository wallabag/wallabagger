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
//    this.setStarredIcon = document.getElementById("set-starred");
//    this.removeStarredIcon = document.getElementById("remove-starred");
    this.setArchivedIcon = document.getElementById("set-archived");
    this.removeArchivedIcon = document.getElementById("remove-archived");
    this.deleteConfirmationCard = document.getElementById("delete_confirmation");
    this.titleInput = document.getElementById("title-input");
    this.cardHeader   = document.getElementById("card-header");
    this.cardBody   = document.getElementById("card-body");

    this.starredIcon = document.getElementById("starred-icon");

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
    setArchivedIcon: null,
    removeArchivedIcon: null,
    deleteConfirmationCard: null,
    titleInput: null,
    cardHeader: null,
    cardBody: null,

    starredIcon: null,

    articleTags: [],
    foundTags: [],
    
    starred: false,
    archived: false,

    getSaveHtml: function (param) {
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

        this.setArchivedIcon.addEventListener('click', this.setArchived.bind(this));
        this.removeArchivedIcon.addEventListener('click', this.removeArchived.bind(this));
        
        this.tagsInput.addEventListener('input',this.onTagsInputChanged.bind(this));
        this.tagsInput.addEventListener('keyup',this.onTagsInputKeyUp.bind(this));

        this.starredIcon.addEventListener('click', this.onIconClick.bind(this));
    },
    
    onIconClick: function(event) {
        event.preventDefault();
        this.toggleIcon(event.currentTarget);
        if (event.currentTarget.id=="starred-icon") {
          this.toggleStarred();
        }  
    },

    toggleIcon: function (icon) {
        let currentState = JSON.parse(icon.dataset.isset);

        icon.classList.remove( currentState ? icon.dataset.seticon : icon.dataset.unseticon );
        icon.classList.add( currentState ? icon.dataset.unseticon : icon.dataset.seticon );

        currentState = ! currentState;
        icon.dataset.isset = JSON.stringify( currentState );
    },

    toggleStarred:  function (e) {
        this.api.SaveStarred(this.articleId, !this.starred).then(d=>{
            this.starred = !this.starred; 
        }).catch(error=>{
                    this.hide(this.infoToast);
                    this.showError(error.message);
           });
    },

    onTagsInputKeyUp: function(event){
        if (event.key=="ArrowRight") this.addFirstFoundTag();
        if ((event.key=="Enter") && ( this.api.data.AllowSpaceInTags ) ){
                let tagStr = `${this.getTagsStr()},${this.tagsInput.value}`;

                if ( this.articleTags.map(t=>t.label).indexOf(this.tagsInput.value) === -1 ) {
                
                    this.disableTagsInput();
                    
                    this.api.SaveTags(this.articleId, this.getSaveHtml( tagStr ) )
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
    
    onFoundTagChipClick: function(event){
      this.addTag( event.currentTarget.dataset.tagid, event.currentTarget.dataset.taglabel );   
      event.currentTarget.parentNode.removeChild(event.currentTarget);
    },

    addFirstFoundTag: function(){
       if (this.foundTags.length > 0) {
         this.addTag( this.foundTags[0].id, this.foundTags[0].label );   
       }
    },

    addTag: function ( tagid, taglabel ) {

        this.tagsInputContainer.insertBefore(
             this.createTagChip( tagid, taglabel ),
             this.tagsInput);

        this.disableTagsInput();

        this.api.SaveTags(this.articleId, this.getSaveHtml( this.getTagsStr() ))
        .then( data => this.loadArticleTags(data) )
        .then( data => this.enableTagsInput() )
        .catch(error=>{
            this.hide(this.infoToast);
            this.showError(error.message);
            })

        this.checkAutocompleteState();
          
    },

    deleteTag: function (ev) {
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
    
    clearAutocompleteList: function () {

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
            this.mainCard.classList.add("pb-30");
            this.show(this.tagsAutoCompleteList);
        } else {
            this.mainCard.classList.remove("pb-30"); 
            this.hide(this.tagsAutoCompleteList);
        }
       
    },
    
    onTagsInputChanged: function (e) {
        e.preventDefault();
       
        this.clearAutocompleteList();
        
        if (this.tagsInput.value != '') {
            let lastChar = this.tagsInput.value.slice(-1)
            if ((lastChar == ',') || (lastChar == ';') || ((lastChar == ' ') && ( ! this.api.data.AllowSpaceInTags )) ) {
                let tagStr = `${this.getTagsStr()},${this.tagsInput.value}`;

                
                if ( this.articleTags.map(t=>t.label).indexOf(this.tagsInput.value.slice(0, -1)) === -1 ) {
                
                    this.disableTagsInput();
                    
                    this.api.SaveTags(this.articleId, this.getSaveHtml( tagStr.slice(0, -1)))
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
        this.api.SaveTitle(this.articleId, this.getSaveHtml( this.cardTitle.innerHTML) )
            .then(data => {
                this.hide( this.cardBody );
                this.show( this.cardHeader );
            })
            .catch(error => {
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
        element.firstChild.addEventListener('click',this.onFoundTagChipClick.bind(this));
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
                            this.toggleIcon(this.starredIcon)
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
                
           // loading all tags     
           apiAuthorised.then( data => this.api.GetTags() )
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
