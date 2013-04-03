/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

Deps.autorun(function () {
  var pl = Session.get('playlist');
  var playing = Session.get('playing');
  var pls = [];
  if(pl) pls.push(pl);
  if(playing && playing.playlist && playing.playlist!=pl) pls.push(playing.playlist);
  Meteor.subscribe('videos', pls.join(','));
});

Template.videosTemplate.helpers({
  isPlaylistPage:function(){
    return Session.get('page') === 'playlist';
  }
});

Template.videosTemplate.rendered = function(){
  setNicescroll("#video-right-container,#video-left-container");
  Deps.autorun(function(){
    Session.get('playing');
    Session.get('playlist');
    setNicescroll("#video-right-container,#video-left-container");
  });
};

// Set Template Events
Template.videosTemplate.events({
  'click #remove-playlist-submit': function (event, template) {
    var pl = event.currentTarget.getAttribute('playlist');
    Meteor.call('removePlaylist', pl);
    $('#remove-playlist-modal').modal('hide');
    var playing = Session.get('playing');
    if(playing && playing.playlist && playing.playlist===pl) Session.set('playing', null);
    if(playing && playing.playlist && playing.playlist!==pl) playlistsRouter.setPlaylist(playing.playlist);
    else homeRouter.goToPage('home');
    return false;
  }
, 'click #remove-video-submit': function (event, template) {
    Meteor.call('removeVideo', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal').modal('hide');
    return false;
  }
});

// Create a router for playlists
var VideosRouter = Backbone.Router.extend({
  routes: {
    "playlist/:playlist/video/:video": "openVideo"
  },
  openVideo: function (playlist, video) {
    this.setVideo(playlist, video);
    Session.set("playing", {video:video,playlist:playlist,date:(new Date()).getTime()});
    if(!Session.get('page')
        || Session.get('page') === '' 
        || Session.get('page') === 'playlist' && !Session.get("playlist")){
      Session.set('page', 'playlist');
      Session.set("playlist", playlist);
    }
  },
  setVideo: function (playlist, video) {
    this.navigate('playlist/'+playlist+'/video/'+video, true);
  }
});

// instantiate router
var videosRouter = new VideosRouter;
