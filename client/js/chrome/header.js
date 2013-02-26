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
  return !!pl && pl.playlist === Session.get('playlist');
};

Template.headerTemplate.events({
  'click #progress-play': function(ev){
    Template.playerTemplate.seekTo(Math.floor(100*ev.offsetX/$('#progress-play').width()));
  }
});
