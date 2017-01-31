AzureAd.whitelistedFields = ['objectId', 'userPrincipalName', 'mail', 'displayName', 'surname', 'givenName'];

OAuth.registerService('azureAd', 2, null, function(query) {

    var tokens = getTokensFromCode(AzureAd.resources.graph.resourceUri, query.code);
    var graphUser = AzureAd.resources.graph.getUser(tokens.accessToken)
    var serviceData = {
        accessToken: tokens.accessToken,
        expiresAt: (+new Date) + (1000 * tokens.expiresIn)
    };

    var fields = _.pick(graphUser, AzureAd.whitelistedFields);

    //must re-write the objectId field to id - meteor expects a field named "id"
    fields.id = fields.objectId; //we should add
    delete fields.objectId;

    _.extend(serviceData, fields);

    // only set the token in serviceData if it's there. this ensures
    // that we don't lose old ones (since we only get this on the first
    // log in attempt)
    if (tokens.refreshToken)
        serviceData.refreshToken = tokens.refreshToken;

    var emailAddress = graphUser.mail || graphUser.userPrincipalName;
    
    var options = {
        profile: {
            name: graphUser.displayName
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


function getTokensFromCode(resource, code) {
    return AzureAd.http.getAccessTokensBase(resource, {
        grant_type: 'authorization_code',
        code : code
    });
};


AzureAd.retrieveCredential = function(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
