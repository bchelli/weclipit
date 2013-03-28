
Template.myFeedTemplate.events({
  'click .video-playlist': function (event, template) {
    playlistsRouter.setPlaylist(event.currentTarget.getAttribute('playlist'));
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click .open-playlist': function (event, template) {
    playlistsRouter.setPlaylist(event.currentTarget.getAttribute('data-playlist-id'));
    return false;
  }
, 'click .open-user': function (event, template) {
    usersRouter.openUser(event.currentTarget.getAttribute('data-user-id'));
    return false;
  }
});

Template.myFeedTemplate.friends = function(){
  Meteor.user();
  return Session.get('friends-list');
};

Template.myFeedTemplate.videos = function(){
  return Session.get('videos-list');
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
        for(var i=0,l=videos.length;i<l;i++){
          videos[i].playlistData = playlists.findOne({_id:videos[i].playlist});
        }
        Session.set('videos-list', videos);
      }
    }
  );
  // SET NICE SCROLL
  setNicescroll("#feedContent");
};