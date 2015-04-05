AzureAd.getConfiguration = function(){
    var config = ServiceConfiguration.configurations.findOne({service: 'azureAd'});
    if (!config)
        throw new ServiceConfiguration.ConfigError();

    //MUST be "popup" - currently Azure AD does not allow for url parameters in redirect URI's. If a null popup style is assigned, then
    //the url parameter "close" is appended and authentication will fail.
    config.loginStyle = "popup";

    return config;
};
