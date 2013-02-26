/*
 * player.js
 *
 * Responsible for rendering the playerTemplate
 */

// helpers
Template.playerTemplate.helpers({
  isType: function(type){
    return this.provider == type;
  }
});

(function(){
  var resizeTO;
  var $window = $(window);
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
      .css({'height':wH-108})
      .addClass('fullscreen')
      ;
  } else {
    $('#player')
      .removeClass('fullscreen')
      .css({'height':''})
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

Template.playerTemplate.getPositionInterval = null;

Template.playerTemplate.rendered = function() {

  function setProgressPosition(position){
    $('#progress-play .bar').width(position+'%');
  }

  function setRefreshProgression(fn){
    Meteor.clearInterval(Template.playerTemplate.getPositionInterval);
    if(!!fn){
      Template.playerTemplate.getPositionInterval = Meteor.setInterval(fn, 1000);
    }
  }

  function setSeeker(fn){
    Template.playerTemplate.seekToPlayer = fn;
  }

  Template.playerTemplate.seekTo = function(position){
    setRefreshProgression();
    setProgressPosition(position);
    Template.playerTemplate.seekToPlayer(position);
  };

  setRefreshProgression();
  setProgressPosition(0);

  var vimeo = document.getElementById('vimeo-player');
  if(vimeo){
    var player = $f(vimeo);
    player.addEvent('ready', function() {
      player.api("play");
      player.addEvent('finish', function(){
        Template.playerTemplate.playerGoTo('next');
      });
      function updatePosition(){
        player.api('getCurrentTime', function(currentTime){
          player.api('getDuration', function(duration){
            setProgressPosition(Math.floor(100*currentTime/duration));
          });
        });
      }
      player.addEvent('seek', function(){
        setRefreshProgression(updatePosition);
      });
      setRefreshProgression(updatePosition);
      setSeeker(function(percent){
        player.api('getDuration', function(duration){
          player.api('seekTo', Math.floor(duration*percent/100));
        });
      });
    });
  }

  var youtube = document.getElementById('youtube-player');
  if(youtube){
    var newPlayer = new YT.Player("youtube-player", {
      "videoId": youtube.getAttribute("providerId"),
      "playerVars": {
        "controls":0
      , "iv_load_policy":3
      , "modestbranding":0
      , "rel":0
      , "showinfo":0
      },
      "events": {
        "onReady": function(){
          newPlayer.playVideo();
          setSeeker(function(percent){
            newPlayer.seekTo(Math.floor(newPlayer.getDuration()*percent/100), true);
          });
        },
        "onStateChange": function(newState){
          if(newState.data==1){
            setRefreshProgression(function(){
              setProgressPosition(Math.floor(100*newPlayer.getCurrentTime()/newPlayer.getDuration()));
            });
          }
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
  return videos.findOne({_id:pl.video,playlist:pl.playlist}, {reactive:false});
};

Template.playerTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return Session.get('page')==='playlist' && !!pl && pl.playlist === Session.get('playlist');
}