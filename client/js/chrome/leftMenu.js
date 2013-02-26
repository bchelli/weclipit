
Template.leftMenuTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return !!pl && pl.playlist === Session.get('playlist');
};

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
