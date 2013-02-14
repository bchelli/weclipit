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
  }
});

// Set Template Helpers
Template.videosTemplate.helpers({
  isPlaying: function () {
    var pl = Session.get("playing");
    return (pl && this._id === pl.video) ? 'icon-play' : '';
  }
});

// Set Template Variables
Template.videosTemplate.videos = function() {
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl});
};
Template.videosTemplate.playlistName = function() {
  var pl = playlists.findOne({_id:Session.get('playlist')});
  console.log(pl);
  return pl && pl.name ? pl.name : '';
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
    $('#add-video-modal').modal();
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
    $('#remove-video-modal').modal();
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
