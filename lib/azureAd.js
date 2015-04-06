AzureAd = {}

AzureAd.getConfiguration = function(returnNullIfMissing){
    var config = ServiceConfiguration.configurations.findOne({service: 'azureAd'});

    if (!config && !returnNullIfMissing)
        throw new ServiceConfiguration.ConfigError();
    else if (!config && returnNullIfMissing)
        return null;

    //MUST be "popup" - currently Azure AD does not allow for url parameters in redirect URI's. If a null popup style is assigned, then
    //the url parameter "close" is appended and authentication will fail.
    config.loginStyle = "popup";

    return config;
};