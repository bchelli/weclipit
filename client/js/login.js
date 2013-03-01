

Template.loginTemplate.rendered = function(){
  var $bg = $('#login-background')
    , $vid = $('.video-home', $bg)
    , $window = $(window)
    , initW = $vid.width()
    , initH = $vid.height()
    , vimeoPlayerHome = document.getElementById('vimeoplayer-home')
    ;

  if(vimeoPlayerHome){
    var player = $f(vimeoPlayerHome);
    player.addEvent('ready', function() {
      player.api("setVolume", 0);
    });
  
    function resize(){
      $bg.height($window.height()-210);
      var w = $bg.width()
        , h = $bg.height()
        , newWidth
        , newHeight
        , newMarginTop
        , newMarginLeft
        ;
      if(h>w*initH/initW){
        // strech height
        newHeight = h;
        newMarginTop = 0;
        newWidth = Math.floor(h*initW/initH);
        newMarginLeft = Math.floor((w-newWidth)/2);
      } else {
        // strech width
        newHeight = Math.floor(w*initH/initW);
        newMarginTop = Math.floor((h-newHeight)/2);
        newWidth = w;
        newMarginLeft = 0;
      }
      newWidth += 100;
      newHeight += 100;
      newMarginTop -= 50;
      newMarginLeft -= 50;
      $vid.css({
        'width':newWidth
      , 'height':newHeight
      , 'margin-left':newMarginLeft
      , 'margin-top':newMarginTop
      });
    }
  
    resize();
    $(window).resize(resize);
  }
};
