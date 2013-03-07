

Meteor.startup(function () {
  // INIT GOOGLE ANALYTICS
  window._gaq = window._gaq || []
  _gaq.push(['_setAccount', 'UA-39093550-1'])
 
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);

  // SET TRACK PAGE VIEW
  function trackPageview(){
    var url = Backbone.history.getFragment();
    window._gaq = window._gaq || [];
    window._gaq.push(['_trackPageview', url]);
  }

  homeRouter.bind('all', trackPageview);
  playlistsRouter.bind('all', trackPageview);
  videosRouter.bind('all', trackPageview);

  // START BACKBONE HISTORY
  Backbone.history.start({pushState: true, root: "/"});
});
