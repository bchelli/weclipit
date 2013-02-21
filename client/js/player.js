/*
 * player.js
 *
 * Responsible for rendering the playerTemplate
 */

// Auto subscribe videos from the selected playlist
Meteor.autorun(function () {
  var pl = Session.get('playing');
  if (pl) {
    Meteor.subscribe('player', pl.playlist, pl.video);
  }
});

// helpers
Template.playerTemplate.helpers({
  isType: function(type){
    return this.provider == type;
  }
});

(function(){
  var resizeTO;
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(updateFullscreen, 100);
  };
  Template.playerTemplate.rendered = function() {
    $window.bind('resize', onResize);
    resizeWindow();
  };
  
  Template.playerTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }
})();

function updateFullscreen(){
  if(Session.get('fullscreen')){
    var wH = $(window).height();
    $('#player')
      .css({'height':wH-107})
      .addClass('fullscreen')
      ;
  } else {
    $('#player')
      .removeClass('fullscreen')
      .css({'height':'auto'})
      ;
  }
}
Template.playerTemplate.toogleFullscreen = function(){
  Session.set('fullscreen', !Session.get('fullscreen'));
  updateFullscreen();
}
Template.playerTemplate.playerStop = function(){
  playlistsRouter.setPlaylist(Session.get('playing').playlist);
  Session.set('playing', null);
};
Template.playerTemplate.playerGoTo = function(direction){
  var fctn = "";
  switch(direction){
    default:
    case 'next':
      fctn = "playNext";
      break;
    case 'prev':
      fctn = "playPrevious";
      break;
  }
  if(fctn!==""){
    Meteor.call(fctn, Session.get('playing'), function(err, nextToPlay){
      if(err) Template.playerTemplate.playerStop();
      else {
        videosRouter.setVideo(nextToPlay.playlist, nextToPlay.video);
      }
    });
  }
};

// After rendering
Template.playerTemplate.rendered = function() {

  var vimeo = document.getElementById('vimeo-player');
  if(vimeo){
    var player = $f(vimeo);
    player.addEvent('ready', function() {
      player.api("play");
      player.addEvent('finish', function(){
        Template.playerTemplate.playerGoTo('next');
      });
    });
  }

  var youtube = document.getElementById('youtube-player');
  if(youtube){
    var newPlayer = new YT.Player("youtube-player", {
      "videoId": youtube.getAttribute("providerId"),
      "playerVars": {
        "controls":1
      , "iv_load_policy":3
      , "modestbranding":0
      , "rel":0
      , "showinfo":0
      },
      "events": {
        "onReady": function(){
          newPlayer.playVideo();
        },
        "onStateChange": function(newState){
          if(newState.data==0){
            Template.playerTemplate.playerGoTo('next');
          }
        }
      }
    });
  }

  updateFullscreen()

};

// Set Template Variables
Template.playerTemplate.video = function() {
  var pl = Session.get('playing');
  if(!pl) return {};
  return videos.findOne({_id:pl.video,playlist:pl.playlist});
};

Template.playerTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return !!pl && pl.playlist === Session.get('playlist');
}