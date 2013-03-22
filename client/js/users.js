
Deps.autorun(function () {
  Meteor.subscribe('userData');
});

Accounts.ui.config({
  passwordSignupFields: 'EMAIL_ONLY'
});
