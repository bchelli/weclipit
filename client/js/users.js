
Deps.autorun(function () {
  Meteor.subscribe('userData');
});

Deps.autorun(function () {
  var u = Session.get('user')
    , ud = Session.get('userData')
    ;
  if(ud && ud._id && ud._id !== u){
    Session.set('userData', {});
  }
  if(u && u !== ''){
    ud = Session.get('userData');
    if(!ud || !ud._id || ud._id !== u){
      Session.set('userLoading', true);
      Meteor.call('getUserProfile', u, function(err, userData){
        Session.set('userLoading', false);
        if(!err) Session.set('userData', userData);
      });
    }
  }
});

Accounts.ui.config({
  passwordSignupFields: 'EMAIL_ONLY'
});

Template.userTemplate.helpers({
  isUserPage:function(){
    return Session.get('page') === 'user';
  }
, isLoading: function(){
    return !!Session.get('userLoading');
  }
});

Template.userTemplate.rendered = function(){
  setNicescroll("#video-right-container,#video-left-container");
  Deps.autorun(function(){
    Session.get('user');
    Session.get('userData');
    setNicescroll("#video-right-container,#video-left-container");
  });
};

// Create a router for users
var UsersRouter = Backbone.Router.extend({
  routes: {
    "user/:user": "openUser"
  },
  openUser: function (user) {
    this.setUser(user);
    Session.set('user', user);
    Session.set('page', 'user');
  },
  setUser: function (user) {
    this.navigate('user/'+user, true);
  }
});

// instantiate router
var usersRouter = new UsersRouter;
