# Privacy policy

wallabagger stores the following personal information and configuration:

- wallabag account login
- wallabag account password
- OpenAI-compatible inference URL
- optional inference API key
- selected inference model
- AI tag suggestions enabled state

This information is stored in the browser's local storage and can be exported as a file.

wallabagger is a third-party browser extension accessing the public wallabag API.

wallabagger is using the current API model (version 2) of wallabag. The way of authentication works the following way:

- You enter your credentials inside the extension
- Your credentials is stored in the browser localstorage
- The extension submits the credentials to the provided wallabag instance
- The credentials are submitted via HTTPS or HTTP according the settings . In case of using HTTP the credentials are readable by everyone who listens to the network connection.
- The wallabag instance sends back an access token, which is used for later connections and refresh token, which is used for refreshing access token after it is expired
- After the refresh token expires itself, the stored credentials are used for obtaining a new one.

AI tag suggestions are opt-in. When enabled, wallabagger sends the grabbed page URL, title, and visible page text to the OpenAI-compatible endpoint configured by the user. wallabagger does not choose or operate that inference provider. It sends no page content to an inference provider while AI tag suggestions are disabled.

All credentials belong to the user and are stored on the user's computer. Wallabag credentials are used only to connect to the configured wallabag installation. An optional inference API key is used only to connect to the user-configured inference provider.
