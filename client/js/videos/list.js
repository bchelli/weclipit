/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

// Set Template Helpers
Template.videosListTemplate.helpers({
  isPlaying: function () {
    var pl = Session.get("playing");
    return pl && this._id === pl.video;
  }
, rightTo: function(right, playlist, myUser, video){
    if(right === "isOwner") return playlists.isOwner(playlist, myUser);
    if(right === "canAccess") return playlists.canAccess(playlist, myUser);
    if(right === "canAddVideo") return playlists.canAddVideo(playlist, myUser);
    if(right === "canRemoveVideo") return playlists.canRemoveVideo(playlist, video, myUser);
    return false;
  }
, liked: function(){
    return this.likes && _.contains(this.likes, Meteor.userId()) ? 'icon-star' : 'icon-star-empty';
  }
, isNotEmpty: function(playlist){
    return playlist && playlist.nbVideos && playlist.nbVideos !== 0;
  }
, isLoaded: function(playlist, videos){
    return playlist.nbVideos === videos.count();
  }
});

// Set Template Variables
Template.videosListTemplate.activePlaylist = function() {
  if(!Session.get('playlist')) return {};
  var pl = playlists.findOne({_id:Session.get('playlist')});
  return pl || {};
};
Template.videosListTemplate.videos = function() {
  if(!Session.get('playlist')) return {};
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl}, {sort:Session.get('video-sort')});
};
Template.videosListTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};
Template.videosListTemplate.ownerObj = function(owner) {
  return Meteor.users.findOne({_id:owner}) || {};
};

// Set Template Events
Template.videosListTemplate.events({
  'click .video-playlist': function (event, template) {
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click .video-playlist a': function (event, template) {
    event.stopPropagation();
  }
, 'click .remove-video': function (event, template) {
    $('#remove-video-submit').attr('video', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal')
      .on('shown', function(){
        $('#remove-video-submit').focus();
      })
      .modal();
    _gaq.push(['_trackEvent', 'video', 'remove']);
    return false;
  }
, 'click .like-video': function (event, template) {
    var videoId = event.currentTarget.getAttribute('video')
      , status = !videos.findOne({_id:videoId}).likes || !_.contains(videos.findOne({_id:videoId}).likes, Meteor.userId())
      ;
    Meteor.call('likeVideo', videoId, status);
    _gaq.push(['_trackEvent', 'video', 'like']);
    return false;
  }
, 'click .open-user': function (event, template) {
    var $target=$(event.currentTarget);
    usersRouter.openUser($target.attr('data-user-id'));
    return false;
  }
});

