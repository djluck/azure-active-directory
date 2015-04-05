AzureAd = {};

var resources = [];

//we remove duplicate resources to allow the re-ordering of resources while giving set-like semantics to resources.
var removeResourceIfPresent = function(resourceUri){
    if (_.contains(resources, resourceUri))
        _.without(resources, resourceUri);
}

AzureAd.resources = {
    addResourceToTopOfHierarchy : function(resourceUri){
        removeResourceIfPresent(resourceUri);

        resources.unshift(resourceUri);
    },
    addResourceToBottomOfHierarchy : function(resourceUri){
        removeResourceIfPresent(resourceUri);

        resources.push(resourceUri);
    },
    getFirstResource : function(){
        return _.first(resources);
    },
    getRestResources : function(){
        return _.rest(resources);
    }
};

AzureAd.resources.addResourceToBottomOfHierarchy("https://outlook.office365.com/");
AzureAd.resources.addResourceToTopOfHierarchy("https://graph.windows.net/");

AzureAd.whitelistedFields = ['objectId', 'userPrincipleName', 'mail', 'displayName', 'surname', 'givenName'];

AzureAd.getTokenForResource = function(resourceUri){
    //check for null user

    //check for un-authenticated user

    //get token using refresh token

    //probably a good idea to include
    //serviceData.resources - graph + office?
}

OAuth.registerService('azureAd', 2, null, function(query) {

    var firstResource = AzureAd.resources.getFirstResource()
    var firstResourceResponse = getAccessTokenFromCode(firstResource, query.code);

    //cases to consider - what if a resource fails in the chain
    var resourceResponses =
        _.chain(AzureAd.resources.getRestResources())
        .map(function(resource){
            //need to transform this into a resource object, complete with all methods
            return [resource, getAccessTokenFromRefreshToken(resource, firstResourceResponse.refreshToken)];
        })
        .union([[firstResource, firstResourceResponse]])
        .object()
        .value();


    var identity = getIdentity(resourceResponses["https://graph.windows.net/"].accessToken);
    var serviceData = {
        accessToken: firstResource.accessToken,
        expiresAt: (+new Date) + (1000 * firstResourceResponse.expiresIn)
    };
    getCalendars(resourceResponses["https://outlook.office365.com/"].accessToken);


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
    if (firstResourceResponse.refreshToken)
        serviceData.refreshToken = firstResourceResponse.refreshToken;

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


function getAccessTokenFromCode(resource, code) {
    return getAccessToken(resource, {
        grant_type: 'authorization_code',
        code : code
    });
};

function getAccessTokenFromRefreshToken(resource, refreshToken){
    return getAccessToken(resource, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });
}

function getAccessToken(resourceUri, additionalRequestParams) {
    var config = getAzureAdConfiguration();

    var url = "https://login.windows.net/" + config.tennantId + "/oauth2/token/";
    var baseParams = {
        client_id: config.clientId,
        client_secret : OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('azureAd', config),
        resource: resourceUri
    };
    var requestBody = _.extend(baseParams, additionalRequestParams);
    var response;
    try {
        response = HTTP.post(url, { params: requestBody } );
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
            scope : response.data.scope,
            resource: response.data.resource
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
