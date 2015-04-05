//where do we store the access tokens for the different resources?
//a seperate collection? On the user?
//serviceData seems a good candidate...
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


 Office 365 isn't really a service, it's some additional properties:
 - access token, refresh token, etc.
 These need to be stored per user. We won't add any additional service config
 we may need a new collection to keep all this stuff. It would probably be better to append this stuff to a user however.
 resources per user- we could fetch these or add them in... not sure.
 users is probably going to be the best place to stash this stuff rather than an individual collections.

 azureAdResources is added to the user when attempting to use office 365.
 What about the graph resource? how do we add this in? Should we add this in?
 Ignore it for now.

 azureAdResources.office365 will contain everything needed
 AzureAdResources.graph could be added in as well...
 how would we add graph details to the thing? tricky..

 azureAdResources needs to be managed
 - registering a resource (the resource uri)
 - adding a resource for a user (adding it to the users azureAdResources collection)
 - authenticating that resources for a user (getting access token
 - for graph, we could watch when an account with the given service identifer was created, kill the watch and update the affected user

 when calling resources, service configuration will come into it.

 */


var getCalendars = function (accessToken) {
    var config = AzureAd.getConfiguration();
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

//"https://outlook.office365.com/"