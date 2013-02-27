Template.headerTemplate.userName = function(){
  var user = Meteor.user();
  return user && user.profile && user.profile.name ? user.profile.name : '';
};

Template.headerTemplate.userPhoto = function(){
  var user = Meteor.user();
  return user && user.services && user.services.facebook && user.services.facebook.id ? 'http://graph.facebook.com/'+user.services.facebook.id+'/picture' : '';
};

Template.headerTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return Session.get('page')==='playlist' && !!pl && pl.playlist === Session.get('playlist');
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
    homeRouter.openHome();
    return false;
  }
});
