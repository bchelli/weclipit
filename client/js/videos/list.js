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
, rightTo: function(right, playlist, myUser, videoOwner){
    var fbId = myUser && myUser.services && myUser.services.facebook && myUser.services.facebook.id ? myUser.services.facebook.id : 0
      , result = playlist.owner === myUser._id
      ;
    if(!result && playlist[right]) result = _.contains(playlist[right], fbId);
    if(!result && videoOwner) result = videoOwner === myUser._id;
    return result;
  }
, liked: function(){
    return this.likes && _.contains(this.likes, Meteor.userId()) ? 'icon-star' : 'icon-star-empty';
  }
});

// Set Template Variables
Template.videosListTemplate.videos = function() {
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl}, {sort:[['nbLikes','desc'],['createdAt','asc'], ['data.title', 'asc']]});
};
Template.videosListTemplate.playlist = function() {
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
Template.videosListTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
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
, 'click #add-video-from-url': function (event, template) {
    $('#add-video-url').val('');
    $('#add-video-modal')
      .on('shown', function(){
        $('#add-video-url').focus();
      })
      .modal();
    return false;
  }
, 'click #add-video-from-search': function (event, template) {
    $('#search-video-query').val('');
    $('#search-video-result').html('');
    $('#search-video-modal')
      .on('shown', function(){
        $('#search-video-query').focus();
      })
      .modal();
    return false;
  }
, 'click .remove-video': function (event, template) {
    $('#remove-video-submit').attr('video', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal')
      .on('shown', function(){
        $('#remove-video-submit').focus();
      })
      .modal();
    return false;
  }
, 'click .like-video': function (event, template) {
    var videoId = event.currentTarget.getAttribute('video')
      , status = !videos.findOne({_id:videoId}).likes || !_.contains(videos.findOne({_id:videoId}).likes, Meteor.userId())
      ;
    Meteor.call('likeVideo', videoId, status);
    return false;
  }
});

