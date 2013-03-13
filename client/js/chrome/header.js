Template.headerTemplate.user = function(){
  return Meteor.user();
};

Template.headerTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return Session.get('page')==='playlist' && !!pl && pl.playlist === Session.get('playlist');
};

Template.headerTemplate.playPauseClass = function(){
  return Session.get('pause') ? 'icon-play' : 'icon-pause';
};

Template.headerTemplate.events({
  'click #progress-play': function(ev){
    var $pp = $('#progress-play')
      , w = $pp.width()
      , offsetX = ev.clientX - $pp.offset().left
      ;
    Template.playerTemplate.seekTo(Math.floor(100*offsetX/w));
    return false;
  }
, 'click .brand': function(ev){
    homeRouter.goToPage('home');
    return false;
  }
, 'click .logout': function(ev){
    Meteor.logout();
    return false;
  }
, 'click .backward': function(ev){
    Template.playerTemplate.playerGoTo('prev');
    return false;
  }
, 'click .stop': function(ev){
    Template.playerTemplate.playerStop();
    return false;
  }
, 'click .play-pause': function(ev){
    Template.playerTemplate.playerPlayPauseToogle();
    return false;
  }
, 'click .forward': function(ev){
    Template.playerTemplate.playerGoTo('next');
    return false;
  }
, 'click .fullscreen': function(ev){
    Template.playerTemplate.toogleFullscreen();
    return false;
  }
});
