AzureAd = {};

// Request AzureAd credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
AzureAd.requestCredential = function (options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    } else if (!options) {
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'azureAd'});
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(
            new ServiceConfiguration.ConfigError());
        return;
    }

    var credentialToken = Random.secret();

    // http://msdn.microsoft.com/en-us/library/azure/dn645542.aspx
    var loginStyle = OAuth._loginStyle('azureAd', config, options);

    var baseUrl = "https://login.windows.net/" + config.tennantId + "/oauth2/authorize?";
    var loginUrl = baseUrl +
        'api-version=1.0&' +
        '&response_type=code' +
        '&client_id=' + config.clientId +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken) +
        '&redirect_uri=' + OAuth._redirectUri('azureAd', config);

    OAuth.launchLogin({
        loginService: "azureAd",
        loginStyle: loginStyle,
        loginUrl: loginUrl,
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,
        credentialToken: credentialToken,
        popupOptions: { height: 600 }
    });
};
