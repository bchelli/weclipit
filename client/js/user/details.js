
Template.userDetailsTemplate.user = function(){
  return Meteor.users.findOne({_id:Session.get('user')});
};
