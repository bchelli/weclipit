
var pageFactory = function(page){
  return function () {
    this.goToPage(page);
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
  , 'feed':   'openFeed'
//  , 'search': 'openSearch'
  },

  openHome: pageFactory('home'),
  openFeed: pageFactory('feed'),
//  openSearch: pageFactory('search'),

  goToPage: function (page) {
    Session.set('page', page);
    this.navigate(page === 'home' ? '' : page, true);
  }
});

// instantiate router
homeRouter = new HomeRouter;
