AzureAd.http = {}

AzureAd.http.call = function (method, url, options) {
    var response;

    try {
        response = HTTP.call(method, url, options)
    }
    catch (err) {
        var details = JSON.stringify({
            url : url,
            options : options,
            method : method
        });
        throw new Meteor.Error("azure-active-directory:failed HTTP request", err.message, details);
    }

    if (response.data.error) {
        var reason = response.data.error;
        var details = JSON.stringify({
            statusCode : response.statusCode,
            url : url,
            options : options,
            method : method
        });
        throw new Meteor.Error("azure-active-directory:invalid HTTP response", "Url=" + reason, details);
    }
    else {
        return response.data;
    }
};

AzureAd.http.callAuthenticated = function (method, url, accessToken, options) {
    options = options || {};
    options.headers = _.extend(options.headers || {}, {
        Authorization : "Bearer " + accessToken
    });

    return AzureAd.http.call(method, url, options);
};

AzureAd.http.getAccessTokensBase = function (resourceUri, additionalRequestParams) {

    var config = AzureAd.getConfiguration();

    var url = "https://login.windows.net/common/oauth2/token/";
    var baseParams = {
        client_id: config.clientId,
        client_secret : OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('azureAd', config),
        resource: resourceUri
    };
    var requestBody = _.extend(baseParams, additionalRequestParams);
    var response = AzureAd.http.call("POST", url, { params: requestBody });

    return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        expiresOn: response.expires_on,
        scope : response.scope,
        resource: response.resource
    };
};