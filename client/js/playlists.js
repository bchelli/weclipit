/*
 * playlist.js
 *
 * Responsible for the fetching of the playlist's accessible 
 *     + the rendering of the playlistsTemplate
 */

// Set Template Variables
Template.playlistsTemplate.playlists = function() {
  return playlists.find({}, {sort:[['name', 'asc']]});
};

// Set Template Helpers
Template.playlistsTemplate.helpers({
  isShared: function () {
    return playlists.canAccess(this);
  }
, isMine: function () {
    return playlists.isOwner(this);
  }
, active: function (page) {
    var active;
    if(Session.get("page") === 'playlist'){
      active = this._id === Session.get("playlist");
    } else {
      active = Session.get("page") === page;
    }
    return active ? 'active' : '';
  }
});


// Set Template Events
Template.playlistsTemplate.events({
  'click .page': function (event, template) {
    homeRouter.goToPage(event.currentTarget.getAttribute('page'));
    return false;
  }
, 'click .playlist': function (event, template) {
    playlistsRouter.setPlaylist(event.currentTarget.getAttribute('playlist'));
    return false;
  }
, 'click #add-playlist': function (event, template) {
    $('#add-playlist-name').val('');
    $('#add-playlist-modal')
      .on('shown', function(){
        $('#add-playlist-name').focus();
      })
      .modal();
    return false;
  }
, 'submit #add-playlist-modal form': function (event, template) {
    Meteor.call('createPlaylist', $('#add-playlist-name').val());
    $('#add-playlist-modal').modal('hide');
    return false;
  }
});

// Create a router for playlists
var PlaylistsRouter = Backbone.Router.extend({
  routes: {
    "playlist/:playlist": "openPlaylist"
  },
  openPlaylist: function (playlist) {
    Session.set('page', 'playlist');
    Session.set("playlist", playlist);
    Session.set('playing', null);
  },
  setPlaylist: function (playlist) {
    this.navigate('playlist/'+playlist, true);
  }
});

// instantiate router
var playlistsRouter = new PlaylistsRouter;
