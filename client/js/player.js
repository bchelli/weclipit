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
        videosRouter.openVideo(nextToPlay.playlist, nextToPlay.video);
      }
    });
  }
};

Template.playerTemplate.getPositionInterval = null;

Template.playerTemplate.rendered = function() {

  function formatTime(time){
    time = Math.floor(time);
    var sec = time % 60
      , min = Math.floor(time/60)
      ;
    if(sec<10) sec = '0'+sec;
    return min+':'+sec;
  }

  function setVideoPlayed(position, total, title){
    var $vp = $('#video-played');
    $vp.find('.video-current-time').html(formatTime(position));
    $vp.find('.video-total-time').html(formatTime(total));
    $vp.find('.video-title-progress').html(title);
  }

  function setProgressPosition(type, position){
    $('#progress-play .bar.'+type).attr('data-percent', position);

    // render
    var playing = parseFloat($('#progress-play .bar.playing').attr('data-percent') || 0);
    var loaded = parseFloat($('#progress-play .bar.loaded').attr('data-percent') || 0);
    $('#progress-play .bar.playing').width(playing+'%');
    $('#progress-play .bar.loaded').width(Math.max(loaded-playing, 0)+'%');
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
    setProgressPosition('playing', position);
    Template.playerTemplate.seekToPlayer(position);
  };
  var pause = function(){}
    , play = function(){}
    ;
  Template.playerTemplate.playerPlayPauseToogle = function(){
    var pauseStatus = !Session.get('pause');
    if(pauseStatus){
      pause();
    } else {
      play();
    }
    Session.set('pause', pauseStatus);
  };

  setVideoPlayed(0,0,'Loading . . .');
  setRefreshProgression();
  setProgressPosition('playing', 0);
  setProgressPosition('loaded', 0);
  Session.set('pause', false);

  var vimeo = document.getElementById('vimeo-player');
  if(vimeo){
    var player = $f(vimeo);
    player.addEvent('ready', function() {
      pause = function(){
        player.api("pause");
      }
      play = function(){
        player.api("play");
      }
      player.api("play");
      player.addEvent('finish', function(){
        Template.playerTemplate.playerGoTo('next');
      });
      player.addEvent('loadProgress', function(obj){
        setProgressPosition('loaded', Math.floor(100*obj.percent));
      });
      player.addEvent('playProgress', function(obj){
        setProgressPosition('playing', Math.floor(100*obj.percent));
        setVideoPlayed(obj.seconds, obj.duration, $('#player').attr('data-title'));
      });
      setSeeker(function(percent){
        player.api('getDuration', function(duration){
          player.api('seekTo', Math.floor(duration*percent/100));
        });
      });
    });
  }

  var youtube = document.getElementById('youtube-player');
  if(youtube){
    if(!YT || !YT.Player) {
      Meteor.setTimeout(function(){
        Template.playerTemplate.rendered();
      }, 100);
      return;
    }
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
          var refresh = function(){
            setProgressPosition('playing', Math.floor(100*newPlayer.getCurrentTime()/newPlayer.getDuration()));
            setProgressPosition('loaded', Math.floor(100*newPlayer.getVideoLoadedFraction()));
            setVideoPlayed(newPlayer.getCurrentTime(), newPlayer.getDuration(), $('#player').attr('data-title'));
          };
          refresh();
          if(newState.data==1){
            setRefreshProgression(refresh);
          }
          if(newState.data==0){
            Template.playerTemplate.playerGoTo('next');
          }
        }
      }
    });
    pause = function(){
      newPlayer.pauseVideo();
    }
    play = function(){
      newPlayer.playVideo();
    }
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