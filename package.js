Package.describe({
    summary: "Azure Active Directory OAuth flow",
    version: "0.1.0"
});

Package.onUse(function(api) {
    api.use('oauth2', ['client', 'server']);
    api.use('oauth', ['client', 'server']);
    api.use('http', ['server']);
    api.use(['underscore', 'service-configuration'], ['client', 'server']);
    api.use(['random', 'templating'], 'client');

    api.export('AzureAd');

    api.addFiles(
        ['azure_ad_configure.html', 'azure_ad_configure.js'],
        'client');

    api.addFiles('azure_ad_server.js', 'server');
    api.addFiles('azure_ad_client.js', 'client');
});
