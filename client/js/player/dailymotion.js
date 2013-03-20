
// init App
var App = App || {};

// init Player
App.player = App.player || {};

// init Player
App.player.dailymotion = function(playerContainer, video, events){
  var playerId = 'dailymotion-player'
    , that = this
    ;
  $('#'+playerContainer).html('<div id="'+playerId+'"></div>');
  that.player = DM.player(playerId, {video: video.providerId});
  that.player.addEventListener('apiready', function() {
    that.context = {
      loadPercent:0
    , playPercent:0
    , seconds:0
    , duration:0
    };
    
    // attach events
    // end of video
    if(events && events.end) {
      that.player.addEventListener('ended', function(){
        events.end();
      });
    }
    if(events && events.pause) {
      that.player.addEventListener('pause', function(){
        events.pause();
      });
    }
    if(events && events.play) {
      that.player.addEventListener('play', function(){
        events.play();
      });
    }
    that.player.addEventListener('timeupdate', function(obj){
      that.context.playPercent = Math.floor(100*obj.target.currentTime/obj.target.duration);
      that.context.seconds = obj.target.currentTime;
      that.context.duration = obj.target.duration;
      if(events && events.progress) events.progress(that.context);
    });

    if(events && events.ready) events.ready();
  });
};
App.player.dailymotion.prototype = {
  pause: function(){
    if(this && this.player && this.player.pause) this.player.pause();
  }
, play: function(){
    if(this && this.player && this.player.play) this.player.play();
  }
, seekTo: function(percent){
    if(this && this.player && this.player.seek) this.player.seek(this.context.duration*percent/100);
  }
, destroy: function(){
    delete this.player;
  }
};

