Template.configureLoginServiceDialogForAzureAd.helpers({
    siteUrl: function () {
        return Meteor.absoluteUrl();
    }
});

Template.configureLoginServiceDialogForAzureAd.fields = function () {
    return [
        {property: 'clientId', label: 'Client ID'},
        {property: 'clientSecret', label: 'Client Secret'},
        {property: 'tennantId', label: 'Tennant Id'}
    ];
};
