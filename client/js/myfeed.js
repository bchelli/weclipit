
Template.myFeedTemplate.helpers({
  isFriendsPage:function(){
    return Session.get('page') === 'feed';
  }
, isPlaying: function () {
    var pl = Session.get("playing");
    return pl && this._id === pl.video;
  }
, formatTime: function(time){
    var delta = (new Date()).getTime() - time;
    if(_.isNaN(delta)) return '?';
    if(delta >= 1000*60*60*24*365) return Math.floor(delta / (1000*60*60*24*365))+' year(s)';
    if(delta >= 1000*60*60*24*30) return Math.floor(delta / (1000*60*60*24*30))+' month(s)';
    if(delta >= 1000*60*60*24) return Math.floor(delta / (1000*60*60*24))+' day(s)';
    if(delta >= 1000*60*60) return Math.floor(delta / (1000*60*60))+' hour(s)';
    return Math.floor(delta / (1000*60))+' minute(s)';
  }
});

Template.myFeedTemplate.events({
  'click .video-playlist': function (event, template) {
    playlistsRouter.setPlaylist(event.currentTarget.getAttribute('playlist'));
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click .open-playlist': function (event, template) {
    playlistsRouter.setPlaylist(event.currentTarget.getAttribute('data-playlist'));
    return false;
  }
});

Template.myFeedTemplate.friends = function(){
  Meteor.user();
  return Session.get('friends-list');
};

Template.myFeedTemplate.playlists = function(){
  return Session.get('playlists-list');
};

Template.myFeedTemplate.rendered = function(){
  var u = Meteor.user();
  // GET MY FRIENDS
  if(u && u.services) {
    var funct;
    if(u.services.facebook) funct = 'getFacebookFriends';
    if(u.services.twitter) funct = 'getTwitterFriends';
    if(u.services.google) funct = 'getGoogleFriends';
    if(funct){
      Meteor.call(funct, function(err, friends){
        if(!err) Session.set('friends-list', friends);
      });
    }
  }
  // GET LAST MOVIES ADDED
  Meteor.call(
    'getLastVideosAdded' 
  , function(err, videos){
      if(!err) {
        var pls = {};
        var plsIds = [];
        for(var i=0,l=videos.length;i<l;i++){
          var v = videos[i];
          if(!pls[v.playlist]) {
            plsIds.push(v.playlist);
            pls[v.playlist] = playlists.findOne({_id:v.playlist});
            pls[v.playlist].videos = [];
          }
          pls[v.playlist].videos.push(v);
        }
        Session.set('playlists-list', _.map(plsIds, function(plId){return pls[plId]}));
      }
    }
  );
};