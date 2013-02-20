/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

// Auto subscribe videos from the selected playlist
Meteor.autorun(function () {
  var pl = Session.get('playlist');
  if (pl) {
    Meteor.subscribe('videos', pl);
    Meteor.subscribe('userData');
  }
});

// Set Template Helpers
Template.videosTemplate.helpers({
  isPlaying: function () {
    var pl = Session.get("playing");
    return (pl && this._id === pl.video) ? 'icon-play' : '';
  }
, rightTo: function(right, playlist, myUser, videoOwner){
    var fbId = myUser && myUser.services && myUser.services.facebook && myUser.services.facebook.id ? myUser.services.facebook.id : 0
      , result = playlist.owner === myUser._id
      ;
    if(!result && playlist[right] && playlist[right].indexOf) result = playlist[right].indexOf(fbId)!==-1;
    if(!result && videoOwner) result = videoOwner === myUser._id;
    return result;
  }
});

// Set Template Variables
Template.videosTemplate.videos = function() {
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl});
};
Template.videosTemplate.playlist = function() {
  var pl = playlists.findOne({_id:Session.get('playlist')});
  return pl || {};
};
Template.videosTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};
Template.videosTemplate.isPlaylistSelected = function() {
  return !!Session.get('playlist');
};

// Set Template Events
Template.videosTemplate.events({
  'click .video': function (event, template) {
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click #add-video': function (event, template) {
    $('#add-video-url').val('');
    $('#add-video-modal')
      .on('shown', function(){
        $('#add-video-url').focus();
      })
      .modal();
    return false;
  }
, 'submit #add-video-modal form': function (event, template) {
    Meteor.call('addVideo', Session.get('playlist'), $('#add-video-url').val(), function(){
      $('#add-video-modal').modal('hide');
    });
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
, 'click #remove-video-submit': function (event, template) {
    Meteor.call('removeVideo', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal').modal('hide');
  }
});

// Create a router for playlists
var VideosRouter = Backbone.Router.extend({
  routes: {
    "playlist/:playlist/video/:video": "openVideo"
  },
  openVideo: function (playlist, video) {
    Session.set('page', 'playlist');
    Session.set("playing", {video:video,playlist:playlist});
    if(!Session.set("playlist")){
      Session.set("playlist", playlist);
    }
  },
  setVideo: function (playlist, video) {
    this.navigate('playlist/'+playlist+'/video/'+video, true);
  }
});

// instantiate router
var videosRouter = new VideosRouter;
