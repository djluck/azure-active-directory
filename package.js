Package.describe({
    summary: "Azure Active Directory OAuth flow",
    version: "0.1.6",
    name: "wiseguyeh:azure-active-directory",
    git: "https://github.com/djluck/azure-active-directory"
});

Package.onUse(function(api) {
    api.use('oauth2@1.1.1', ['client', 'server']);
    api.use('oauth@1.1.2', ['client', 'server']);
    api.use('http@1.0.8', ['server']);
    api.use(['underscore@1.0.1', 'service-configuration@1.0.2'], ['client', 'server']);
    api.use(['random@1.0.1', 'templating@1.0.9'], 'client');

    api.export('AzureAd');

    api.addFiles(
        ['azure_ad_configure.html', 'azure_ad_configure.js'],
        'client');

    api.addFiles('azure_ad_server.js', 'server');
    api.addFiles('azure_ad_client.js', 'client');
});
