

Template.loggedTemplate.userName = function(){
  var user = Meteor.user();
  return user && user.profile && user.profile.name ? user.profile.name : '';
};

