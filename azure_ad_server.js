AzureAd.whitelistedFields = ['objectId', 'userPrincipleName', 'mail', 'displayName', 'surname', 'givenName'];

OAuth.registerService('azureAd', 2, null, function(query) {

    var firstResource = AzureAd.resources.getFirstResource()
    var firstResourceResponse = getAccessTokenFromCode(firstResource, query);

    //cases to consider - what if a resource fails in the chain
    var otherResourceResponses =
        _.chain(AzureAd.resources.getRestResources())
        .map(function(resource){
            //need to transform this into a resource object, complete with all methods
            return {
                resource : resource,
                response:  getAccessTokenFromRefreshToken(resource, firstResourceResponse.accessToken)
            }
        })
        .value();


    var identity = getIdentity(_.skip(otherResourceResponses, 1).accessToken);
    var serviceData = {
        accessToken: accessToken,
        expiresAt: (+new Date) + (1000 * response.expiresIn)
    };
    getCalendars(accessToken);

    console.log(response.accessToken == office365Token.accessToken);
    console.log(response.refreshToken == office365Token.refreshToken);
    //going to need to store different service configurations per token

    /*
    A resource is an entity made up of the following values:
    - resource (name)
    - refresh_token
    - access_token
    - expires_on
    - scope

    A resource should provide:
    - isAccessTokenExpired()
    - getOrRefreshAccessToken() - a mechanism to get access token (use refresh_token to automatically get an up-to-date token)


    The library should provide
    - The inbuilt resource, graph
    - A method to register additional resources, specifying the order in which they are added

    Resources is one or more Resource entities, in a specified order.
    - addResourceToTopOfHierarchy(r)
    - addResourceToBottomOfHierarchy(r)
    - getResources()

    how do we package the office 365 resource? As a standalone package
    (this package does nothing but add the office 365 resource to the top of the hierarchy)
    we then provide the office 365 api on top of this.


     */

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


var getAccessTokenFromCode = function (resource, code) {
    return getAccessToken(resource, {
        grant_type: 'authorization_code',
        code : code
    });
};

var getAccessTokenFromRefreshToken = function(resource, refreshToken){
    return getAccessToken(resource, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });
}

var getAccessToken = function (resourceUri, additionalRequestParams) {
    var config = getAzureAdConfiguration();

    var url = "https://login.windows.net/" + config.tennantId + "/oauth2/token/";
    var baseParams = {
        client_id: config.clientId,
        client_secret : OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('azureAd', config),
        resource: resourceUri
    };
    var response;
    try {
        response = HTTP.post(url, { params: _.extend(baseParams, additionalRequestParams) });
    }
    catch (err) {
        throw getError("Request for " + resourceUri + " access token failed", err.message, url, requestBody);
    }

    if (response.data.error) {
        throw getError("Received erroneous response when requesting " + resourceUri + " access token", response.data.error, url, requestBody);
    }
    else {
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
            expiresOn: response.data.expires_on,
            scope : response.scope,
            resource: response.resource
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

var getCalendars = function (accessToken) {
    var config = getAzureAdConfiguration();
    var url = "https://outlook.office365.com/api/v1.0/me/calendarview?startdatetime=2015-04-01T23:00:00.000Z&enddatetime=2015-04-02T23:00:00.000Z";

    var requestBody = {
        headers: { Authorization : "Bearer " + accessToken}
    }
    try {
        var response =  HTTP.get(url, requestBody);
        console.log(response);

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
