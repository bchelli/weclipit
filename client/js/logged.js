
var pageFactory = function(page){
  return function (playlist) {
    Session.set('page', page);
    Session.set('playing', null);
  }
};

Template.loggedTemplate.helpers({
  'hasName':function(){
    var u = Meteor.user();
    return u && u.profile && u.profile.name;
  }
});

// Create a router for playlists
var HomeRouter = Backbone.Router.extend({
  routes: {
    '':       'openHome'
//  , 'search': 'openSearch'
  },

  openHome: pageFactory('home'),
//  openSearch: pageFactory('search'),

  goToPage: function (page) {
    this.navigate(page === 'home' ? '' : page, true);
  }
});

// instantiate router
var homeRouter = new HomeRouter;
