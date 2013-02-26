
Template.loggedTemplate.helpers({
  isPage:function(page){
    return Session.get('page') === page;
  }
});

var pageFactory = function(page){
  return function (playlist) {
    Session.set('page', page);
  }
};

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
