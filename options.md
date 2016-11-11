# Options

First of all: you have to create new client on your wallabag installation. How to do that is described in [Documentation](http://doc.wallabag.org/en/master/developer/api.html#creating-a-new-api-client)
What we need from that client is two strings: Client ID and Client secret:

    ![Client](images/opt-client.png)

## Access options page

After installation of wallabagger extension you can setup it by options page. This page is accessible by

* Right click on extension icon and choose menu "options"

    ![Menu](images/opt-menu.png)

* Go to your chrome-based browser [extension setup page](chrome://extensions), and click on "options" in wallabagger section

    ![extensions](images/opt-ext-optlink.png)

## Setup process

* Enter URL of your wallabag installation (without "http://" ), check "https" if you use that, and click "Check URL" button

    ![URL](images/opt-url.png)

    if URL is valid then in checklist in the bottom of page will be information about that.

    ![checklist](images/opt-checklist.png)

* If URL was checked and api version is > 2 then appears client and user information fields. Fill it and click "Get token" button. In future access token will get authomatically, when it expires.

    ![Client fields](images/opt-clientfields.png)

    if information is correct in checklist will be information about that.

    ![Token granted](images/opt-granted.png)

* If you are to have tags consisting space in its, check appropriate options. This change fix symbol in tag input from Space to Enter

    ![Space in tags](images/opt-spaceintags.png)

## Security warning

In this version of extension your password is stored in browser local storage in plain text and can be retrieved by abuser. Password encryption will be implemented in future versions.
