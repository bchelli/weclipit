(function(){
  var $window = $(window)
    , delta = 105
    ;
  var resizeWindow = function(){
    var wH = $window.height();
    $('#menuContainer,#playlistContainer').css({'height':wH-delta});
  };
  var resizeTO;
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(resizeWindow, 100);
  };
  Template.loggedTemplate.rendered = function() {
    $window.bind('resize', onResize);
    resizeWindow();
    Deps.autorun(function(){
      if(embed.isEmbedActivated()) delta = 0;
      resizeWindow();
    });
  };
  
  Template.loggedTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }

})();

Template.leftMenuTemplate.isInPlaylist = function(){
  return Session.get("page") === 'user' || Session.get("page") === 'playlist' && Session.get('playlist') ? 'in-playlist' : '';
}
