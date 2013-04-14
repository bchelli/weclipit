
// init Player
Meteor.player = Meteor.player || {};

// init Player
Meteor.player.youtube = function(playerContainer, video, events){
  var playerId = 'youtube-player'
  $('#'+playerContainer).html('<div id="'+playerId+'"></div>');
  var youtube = document.getElementById(playerId)
    , that = this
    , qualities = {
        "tiny":     "144p"
      , "small":    "240p"
      , "medium":   "360p"
      , "large":    "480p"
      , "hd720":    "720p"
      , "hd1080":   "1080p"
      , "highres":  "greater"
      }
    ;

  that.context = {
    loadPercent:0
  , playPercent:0
  , seconds:0
  , duration:0
  };

  var refresh = function(){
    if(that.player && that.player.getDuration) that.context.duration = that.player.getDuration();
    if(that.player && that.player.getCurrentTime) that.context.seconds = that.player.getCurrentTime();
    if(that.player && that.player.getVideoLoadedFraction) that.context.loadPercent = Math.floor(100*that.player.getVideoLoadedFraction());
    that.context.playPercent = Math.floor(100*that.context.seconds/that.context.duration);
    if(events && events.progress) events.progress(that.context);
  };

  that.getPositionInterval = null;

  that.player = new YT.Player(playerId, {
    "videoId": video.providerId,
    "playerVars": {
      "controls":0
    , "iv_load_policy":3
    , "modestbranding":0
    , "rel":0
    , "showinfo":0
    },
    "events": {
      "onReady": function(){
        if(events && events.ready) events.ready();
      },
      "onStateChange": function(newState){
        refresh();
        if(newState.data==1){
          Meteor.clearInterval(that.getPositionInterval);
          that.getPositionInterval = Meteor.setInterval(refresh, 1000);
          if(events && events.play) events.play();
          if(events && events.qualities){
            var resolutions = [];
            _.each(that.player.getAvailableQualityLevels(), function(res){resolutions.push({key:res,value:qualities[res]});});
            events.qualities(resolutions);
          }
        }
        if(newState.data==2){
          if(events && events.pause) events.pause();
        }
        if(newState.data==0){
          if(events && events.end) events.end();
        }
      }
    }
  });
};
Meteor.player.youtube.prototype = {
  pause: function(){
    if(this && this.player && this.player.pauseVideo) this.player.pauseVideo();
  }
, play: function(){
    if(this && this.player && this.player.playVideo) this.player.playVideo();
  }
, seekTo: function(percent){
    if(this && this.player && this.player.seekTo) this.player.seekTo(Math.floor(this.player.getDuration()*percent/100), true);
  }
, setQuality: function(quality){
    if(this && this.player && this.player.setPlaybackQuality) this.player.setPlaybackQuality(quality);
  }
, destroy: function(){
    try{
      if(this.player && this.player.stopVideo) this.player.stopVideo();
      if(this.player && this.player.destroy) this.player.destroy();
      delete this.player;
    } catch(e) {
    }
    Meteor.clearInterval(this.getPositionInterval);
  }
};

