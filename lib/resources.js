AzureAd.resources = {};

var resources = {};

AzureAd.resources.registerResource = function(friendlyName, resourceUri){
    resources[friendlyName] = resourceUri;
};

AzureAd.resources.getOrUpdateUserAccessToken = function(friendlyName, user){
    checkResourceExists(friendlyName);
    checkUserIsDefined(user);
    ensureAzureAdResourcesOnUser(user, friendlyName);

    if (isAccessTokenMissingOrExpired(user, friendlyName)){
        var tokens = getTokensForResource(user, friendlyName);
        saveTokensForUser(user, friendlyName, tokens);
    }

    return user.azureAdResources[friendlyName].accessToken;
}

function getTokensForResource(user, friendlyName){
    return AzureAd.http.getAccessTokensBase(resources[friendlyName], {
        grant_type: 'refresh_token',
        refresh_token: user.services.azureAd.refreshToken
    });
}

function saveTokensForUser(user, friendlyName, tokens){
    user.azureAdResources[friendlyName] = tokens;
    var modifier = { "$set" : {} };
    modifier["$set"]["azureAdResources." + friendlyName] = user.azureAdResources[friendlyName];

    Meteor.users.update(user._id, modifier);
}

function isAccessTokenMissingOrExpired(user, friendlyName){
    return !user.azureAdResources[friendlyName].accessToken || user.azureAdResources[friendlyName].expiresAt >= new Date();
}

function checkUserIsDefined(user) {
    if (!user){
        throw new Meteor.Error("azure-active-directory:User required", "The supplied user is null or undefined");
    }
}

function ensureAzureAdResourcesOnUser(user, friendlyName){
    if (!user.azureAdResources){
        user.azureAdResources = {};
    }
    if (!user.azureAdResources[friendlyName]){
        user.azureAdResources[friendlyName] = {};
    }
}

function checkResourceExists(friendlyName){
    if (!(friendlyName in resources)) {
        var details = "Could not find a resource with the friendly name '" + friendlyName + "'.";
        throw new Meteor.Error("azure-active-directory:Resource not registered", details);
    }
}




