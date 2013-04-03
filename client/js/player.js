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

Deps.autorun(function () {
  var playing = Session.get('playing');
  if(playing && playing.playlist) Meteor.subscribe('playing-videos', playing.playlist);
});

var playPauseTO = null;
Template.playerTemplate.events({
  'dblclick #player-over': function(){
    Meteor.clearTimeout(playPauseTO);
    Template.playerTemplate.toogleFullscreen();
    return false;
  }
, 'click #player-over': function(){
    Meteor.clearTimeout(playPauseTO);
    playPauseTO = Meteor.setTimeout(function(){
      Template.playerTemplate.playerPlayPauseToogle();
    }, 500);
    return false;
  }
});

function formatTime(time){
  time = Math.floor(time);
  var sec = time % 60
    , min = Math.floor(time/60)
    ;
  if(sec<10) sec = '0'+sec;
  return min+':'+sec;
}

(function(){

  var player;
  
  function updateFullscreen(){
    // FIX Bug due to nicescroll
    $('#playlistContent').css('position', '');
    if(Session.get('fullscreen')){
      var wH = $(window).height();
      $('#player').css({'height':wH-105});
      $('body').addClass('fullscreen');
    } else {
      $('#player').css({'height':''});
      $('body').removeClass('fullscreen');
    }
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
      if(player && player.pause) player.pause();
    } else {
      if(player && player.play) player.play();
    }
  };

  var events = {
    end:function(){
      Template.playerTemplate.playerGoTo('next');
    }
  , progress:function(obj){
      setProgressPosition('loaded', obj.loadPercent);
      setProgressPosition('playing', obj.playPercent);
      setVideoPlayed(obj.seconds, obj.duration, $('#player').attr('data-title'));
    }
  , ready:function(){
      if(!$('body').hasClass('mobile')){
        if(player && player.play) player.play();
        else setTimeout(events.ready, 100);
      }
    }
  , pause:function(){
      Session.set('pause', true);
    }
  , play:function(){
      Session.set('pause', false);
    }
  };


  Template.playerTemplate.toogleFullscreen = function(){
    Session.set('fullscreen', !Session.get('fullscreen'));
    updateFullscreen();
  }
  Template.playerTemplate.playerStop = function(){
    Session.set('fullscreen', false);
    updateFullscreen();
    var pl = Session.get('playlist');
    if(pl) playlistsRouter.setPlaylist(pl);
    Session.set('playing', null);
  };
  Template.playerTemplate.playerGoTo = function(direction){
    var playing = Session.get('playing')
      , v = videos.find({playlist:playing.playlist}, {sort:Session.get('video-sort')}).fetch()
      , position = -1
      ;
    // find the position
    _.some(v, function(video, index){
      if(video._id === playing.video){
        position = index;
        return true;
      }
      return false;
    });
    if(direction === 'next') position++;
    if(direction === 'prev') position--;
    if(position<0) position = v.length - 1;
    if(position>=v.length) position = 0;
    videosRouter.openVideo(v[position].playlist, v[position]._id);
  };

  Template.playerTemplate.rendered = function(){
    // Manage Change playing state
    var playVideoTO;
    Deps.autorun(function(){
      if(player && player.destroy) player.destroy();
      $('#player-content').html('');
      var isPlaying = Session.get("playing");
      if(isPlaying){
        $('#playerContent,#videosContent').addClass('isPlaying');
        setVideoPlayed(0,0,'Loading . . .');
        setProgressPosition('playing', 0);
        setProgressPosition('loaded', 0);
        Session.set('pause', true);
        var pl = Session.get('playing');
        if(pl){
          function startVideo(attempt){
            Meteor.clearTimeout(playVideoTO);
            var video = videos.findOne({_id:pl.video,playlist:pl.playlist}, {reactive:false});
            if(video){
              $('#player').attr('data-title', video.data.title);
              if(video.provider === 'soundcloud'){
                $('#playerContent,#videosContent').removeClass('isPlaying');
              }
              if(App.player[video.provider]){
                player = new App.player[video.provider]('player-content', video, events);
              }
            } else {
              if(attempt<=4){
                playVideoTO = Meteor.setTimeout(function(){
                  startVideo(attempt+1);
                },500);
              }
            }
          }
          startVideo(0);
        }
      } else {
        $('#playerContent,#videosContent').removeClass('isPlaying');
      }
    });
  };

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
})();
