
// init App
var App = App || {};

// init Player
App.player = App.player || {};

// init Player
App.player.soundcloud = function(playerContainer, video, events){
  var playerId = 'soundcloud-player'
    , that = this
    ;
  $('#'+playerContainer).html('<iframe id="'+playerId+'" scrolling="no" frameborder="no" src="http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F'+video.providerId+'&amp;auto_play=false&amp;show_artwork=true&amp;color=0066cc"></iframe>');

  that.player = SC.Widget(playerId);

  that.player.bind(SC.Widget.Events.READY, function(){
    that.context = {
      loadPercent:0
    , playPercent:0
    , seconds:0
    , duration:0
    };
    // attach events
    // end of video
    if(events && events.end) {
      that.player.bind(SC.Widget.Events.FINISH, function(){
        events.end();
      });
    }
    if(events && events.pause) {
      that.player.bind(SC.Widget.Events.PAUSE, function(){
        events.pause();
      });
    }
    if(events && events.play) {
      that.player.bind(SC.Widget.Events.PLAY, function(){
        events.play();
      });
    }

    that.player.getDuration(function(duration){
      that.context.duration = Math.floor(duration / 1000);
      if(events && events.progress) events.progress(that.context);
    });
    var updatePositions = function(obj){
      that.context.playPercent = Math.floor(100*obj.relativePosition);
      that.context.loadPercent = Math.floor(100*obj.loadedProgress)
      that.context.seconds = Math.floor(obj.currentPosition / 1000);
      if(events && events.progress) events.progress(that.context);
    };
    that.player.bind(SC.Widget.Events.LOAD_PROGRESS, updatePositions);
    that.player.bind(SC.Widget.Events.PLAY_PROGRESS, updatePositions);

    if(events && events.ready) events.ready();
  });
};
App.player.soundcloud.prototype = {
  pause: function(){
    if(this && this.player && this.player.pause) this.player.pause();
  }
, play: function(){
    if(this && this.player && this.player.play) this.player.play();
  }
, seekTo: function(percent){
    if(this && this.player && this.player.seekTo) this.player.seekTo(this.context.duration*1000*percent/100);
  }
, destroy: function(){
    delete this.player;
  }
};
