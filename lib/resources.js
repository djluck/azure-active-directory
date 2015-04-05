AzureAd.resources = {};

AzureAd.resources.collection = {} //create collection here that just stores names

AzureAd.resources.registerResource = function(resourceUri) {

};

AzureAd.resources.getOrUpdateUserAccessToken = function(resourceUri, user){
    //check for null user

    //check for un-authenticated user

    //get token using refresh token

    //probably a good idea to include
    //serviceData.resources - graph + office?

    return AzureAd.http.getAccessTokensBase(resourceUri, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });
}





