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

AzureAd.resources.addResourceToTopOfHierarchy("https://outlook.office365.com/");
AzureAd.resources.addResourceToBottomOfHierarchy("https://graph.windows.net/");
