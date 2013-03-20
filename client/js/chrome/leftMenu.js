(function(){
  var $window = $(window);
  var resizeWindow = function(){
    var wH = $window.height();
    $('#menuContainer,#playlistContainer').css({'height':wH-108});
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

Template.leftMenuTemplate.isInPlaylist = function(){
  return Session.get("page") === 'playlist' && Session.get('playlist') ? 'in-playlist' : '';
}
