

Meteor.startup(function () {
  function trackPageview(){
    var url = Backbone.history.getFragment();
    window._gaq = window._gaq || [];
    window._gaq.push(['_trackPageview', url]);
  }

  homeRouter.bind('all', trackPageview);
  playlistsRouter.bind('all', trackPageview);
  videosRouter.bind('all', trackPageview);

  Backbone.history.start({pushState: true, root: "/"});
});
