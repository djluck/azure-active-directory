AzureAd.resources.graph = {};
AzureAd.resources.graph.friendlyName = "graph";
AzureAd.resources.graph.resourceUri = "https://graph.windows.net/";

AzureAd.resources.graph.getUser = function (accessToken) {
    var config = AzureAd.getConfiguration();
    var url = "https://graph.windows.net/myorganization/me?api-version=2013-11-08";

    return AzureAd.http.callAuthenticated("GET", url, accessToken);
};

if (Meteor.isServer){
    Meteor.startup(function(){
        AzureAd.resources.registerResource(AzureAd.resources.graph.friendlyName, AzureAd.resources.graph.resourceUri);
    });
}
