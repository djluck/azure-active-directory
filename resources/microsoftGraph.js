AzureAd.resources.microsoftGraph = {};
AzureAd.resources.microsoftGraph.friendlyName = "microsoftGraph";
AzureAd.resources.microsoftGraph.resourceUri = "https://graph.microsoft.com/";

AzureAd.resources.microsoftGraph.getUser = function (accessToken) {
    var config = AzureAd.getConfiguration();
    var url = AzureAd.resources.microsoftGraph.resourceUri + "v1.0/me";

    return AzureAd.http.callAuthenticated("GET", url, accessToken);
};

if (Meteor.isServer){
    Meteor.startup(function(){
        AzureAd.resources.registerResource(AzureAd.resources.microsoftGraph.friendlyName, AzureAd.resources.microsoftGraph.resourceUri);
    });
}
