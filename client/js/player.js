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

var player;

Template.playerTemplate.rendered = function() {

  var update = function () {
    var ctx = new Meteor.deps.Context();  // invalidation context
    ctx.onInvalidate(update);             // rerun update() on invalidation
    ctx.run(function () {
      var isPlaying = Session.get("playing");
      if(isPlaying){
        $('#playerContent,#videosContent').addClass('isPlaying');
      } else {
        $('#playerContent,#videosContent').removeClass('isPlaying');
      }
    });
  };
  update();

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

  function setSeeker(fn){
    Template.playerTemplate.seekToPlayer = fn;
  }

  Template.playerTemplate.seekTo = function(position){
    setProgressPosition('playing', position);
    player.seekTo(position);
  };

  Template.playerTemplate.playerPlayPauseToogle = function(){
    var pauseStatus = !Session.get('pause');
    if(pauseStatus){
      player.pause();
    } else {
      player.play();
    }
    Session.set('pause', pauseStatus);
  };

  setVideoPlayed(0,0,'Loading . . .');
  setProgressPosition('playing', 0);
  setProgressPosition('loaded', 0);
  Session.set('pause', false);


  var events = {
    end:function(){
      Template.playerTemplate.playerGoTo('next');
    }
  , progress:function(obj){
      setProgressPosition('loaded', obj.loadPercent);
      setProgressPosition('playing', obj.playPercent);
      setVideoPlayed(obj.seconds, obj.duration, $('#player').attr('data-title'));
    }
  };

  if(player && player.destroy) player.destroy();

  var vimeo = document.getElementById('vimeo-player');
  if(vimeo){
    player = new App.player.vimeo('vimeo-player', events);
  }

  var youtube = document.getElementById('youtube-player');
  if(youtube){
    player = new App.player.youtube('youtube-player', events);
  }


  var resizeTO;
  var $window = $(window);
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(updateFullscreen, 100);
  };
  $window.bind('resize', onResize);
  updateFullscreen();
  
  Template.playerTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }

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