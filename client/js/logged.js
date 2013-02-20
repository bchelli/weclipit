

Template.loggedTemplate.userName = function(){
  var user = Meteor.user();
  return user && user.profile && user.profile.name ? user.profile.name : '';
};

Template.loggedTemplate.isPlaying = function(){
  return !!Session.get('playing');
};

Template.loggedTemplate.page = function(){
  return Session.get('page');
};

Template.loggedTemplate.helpers({
  isPage:function(page){
    return Session.get('page') === page;
  }
});

Template.loggedTemplate.events({
  'click .page': function (event, template) {
    homeRouter.goToPage(event.currentTarget.getAttribute('page'));
    return false;
  }
});

(function(){
  var $window = $(window);
  var resizeWindow = function(){
    var wH = $window.height();
    $('#menuContainer,#playlistContainer').css({'height':wH-107});
  };
  var resizeTO;
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(resizeWindow, 100);
  };
  Template.loggedTemplate.rendered = function() {
    $window.bind('resize', onResize);
    resizeWindow();
  };
  
  Template.loggedTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }
})();

var pageFactory = function(page){
  return function (playlist) {
    Session.set('page', page);
  }
};

// Create a router for playlists
var HomeRouter = Backbone.Router.extend({
  routes: {
    '':       'openHome'
  , 'search': 'openSearch'
  },

  openHome: pageFactory('home'),
  openSearch: pageFactory('search'),

  goToPage: function (page) {
    this.navigate(page === 'home' ? '' : page, true);
  }
});

// instantiate router
var homeRouter = new HomeRouter;
