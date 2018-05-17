# Privacy policy

wallabagger stores next personal information associated with your wallabag account:

- wallabag account login
- wallabag account password

The credentials are stored in the browser localstorage. It can be exported as a file as well.

wallabagger is a third-party browser extension accessing the public wallabag API.

wallabagger is using the current API model (version 2) of wallabag. The way of authentication works the following way:

- You enter your credentials inside the extension
- Your credentials is stored in the browser localstorage
- The extension submits the credentials to the provided wallabag instance
- The credentials are submitted via HTTPS or HTTP according the settings . In case of using HTTP the credentials are readable by everyone who listens to the network connection.
- The wallabag instance sends back an access token, which is used for later connections and refresh token, which is used for refreshing access token after it is expired
- After the refresh token expires itself, the stored credentials are used for obtaining a new one.

All credentials belong to user, are stored in the user's computer and are used only to connect to the wallabag installation.
