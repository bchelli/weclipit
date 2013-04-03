
Deps.autorun(function () {
  Meteor.subscribe('userData');
});

Deps.autorun(function () {
  var u = Session.get('user');
  if(u && u !== ''){
    Meteor.subscribe('user-info', u);
    Meteor.subscribe('user-info-playlists', u);
  }
});

Accounts.ui.config({
  requestPermissions:{
    google:['profile', 'email', 'https://www.googleapis.com/auth/plus.login']
  }
, passwordSignupFields: 'EMAIL_ONLY'
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
};

// Create a router for users
var UsersRouter = Backbone.Router.extend({
  routes: {
    "user/:user": "openUser"
  },
  openUser: function (user) {
    this.setUser(user);
    Session.set('user', '');
    Session.set('user', user);
    Session.set('page', 'user');
  },
  setUser: function (user) {
    this.navigate('user/'+user, true);
  }
});

// instantiate router
var usersRouter = new UsersRouter;
