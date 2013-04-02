
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
  return videos.getLastVideosAdded(Meteor.userId());
};

Template.myFeedTemplate.thePlaylist = function(){
  return playlists.findOne({_id:this.playlist});
};

Deps.autorun(function(){
  var u = Meteor.user();
  
  Meteor.subscribe('getLastVideosAdded', Meteor.userId());

  Session.set('friends-list', []);

  // must be logged
  if(u && u.services) {
    // GET MY FRIENDS
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
});

Template.myFeedTemplate.rendered = function(){
  // SET NICE SCROLL
  setNicescroll("#feedContent");
  if($('.feed-content').length !== 0) $('body').addClass('display-feeds');
  else $('body').removeClass('display-feeds');
};