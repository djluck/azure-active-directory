AzureAd = {};

AzureAd.whitelistedFields = ['objectId', 'userPrincipleName', 'mail', 'displayName', 'surname', 'givenName'];

OAuth.registerService('azureAd', 2, null, function(query) {

    var response = getTokens(query);
    var accessToken = response.accessToken;
    var identity = getIdentity(accessToken);

    var serviceData = {
        accessToken: accessToken,
        expiresAt: (+new Date) + (1000 * response.expiresIn)
    };

    var fields = _.pick(identity, AzureAd.whitelistedFields);

    //must re-write the objectId field to id - meteor expects a field named "id"
    fields.id = fields.objectId;
    delete fields.objectId;

    _.extend(serviceData, fields);

    // only set the token in serviceData if it's there. this ensures
    // that we don't lose old ones (since we only get this on the first
    // log in attempt)
    if (response.refreshToken)
        serviceData.refreshToken = response.refreshToken;

    var emailAddress = identity.mail || identity.userPrincipleName;
    
    var options = {
        profile: {
            name: identity.displayName
        }
    };

    if (!!emailAddress){
        options.emails = [{
            address : emailAddress,
            verified: true
        }];
    }
    return { serviceData: serviceData, options: options };
});

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
// - refreshToken, if this is the first authorization request
var getTokens = function (query) {
    var config = getAzureAdConfiguration();

    var url = "https://login.windows.net/" + config.tennantId + "/oauth2/token/";
    var requestBody = {
        params: {
            client_id: config.clientId,
            grant_type: 'authorization_code',
            client_secret : OAuth.openSecret(config.secret),
            resource: "https://graph.windows.net",
            redirect_uri: OAuth._redirectUri('azureAd', config),
            code: query.code
        }
    };
    var response;
    try {
        response = HTTP.post(
            url,
            requestBody
        );
    } catch (err) {
        throw getError("Failed to complete OAuth handshake with AzureAd", err.message, url, requestBody);
    }

    if (response.data.error) { // if the http response was a json object with an error attribute
        throw getError("Failed to complete OAuth handshake with AzureAd", response.data.error, url, requestBody);
    } else {
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        };
    }
};

var getIdentity = function (accessToken) {
    var config = getAzureAdConfiguration();
    var url = "https://graph.windows.net/" + config.tennantId + "/me?api-version=2013-11-08";

    var requestBody = {
        headers: { Authorization : "Bearer " + accessToken}
    }
    try {
        var response =  HTTP.get(url, requestBody);
        return response.data;

    } catch (err) {
        throw getError("Failed to fetch identity from AzureAd", err.message, url, requestBody);
    }
};


AzureAd.retrieveCredential = function(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

var getError = function(message, errorMessage, url, requestBody){
    return new Error(message + ": " + errorMessage + "\nSent to: " + url + "\nRequest body: " + JSON.stringify(requestBody));
}

var getAzureAdConfiguration = function(){
    var config = ServiceConfiguration.configurations.findOne({service: 'azureAd'});
    if (!config)
        throw new ServiceConfiguration.ConfigError();

    //MUST be "popup" - currently Azure AD does not allow for url parameters in redirect URI's. If a null popup style is assigned, then
    //the url parameter "close" is appended and authentication will fail.
    config.loginStyle = "popup";

    return config;
}
