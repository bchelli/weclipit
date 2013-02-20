/*
 * playlist.js
 *
 * Responsible for the fetching of the playlist's accessible 
 *     + the rendering of the playlistsTemplate
 */

// Subscribe to my playlists
Meteor.autorun(function(){
  Meteor.subscribe("playlists", Meteor.userId());
});

// Set Template Variables
Template.playlistsTemplate.playlists = function() {
  return playlists.find();
};

// Set Template Helpers
Template.playlistsTemplate.helpers({
  isMine: function () {
    return this.owner === Meteor.userId();
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

Template.playlistsTemplate.filterFriends = function(text){
  text = text.toLowerCase();
  _.each(Template.playlistsTemplate.friends, function(friend, index){
    if(text === '' || friend.name.toLowerCase().indexOf(text)!==-1){
      $('#friend-'+index).show();
    } else {
      $('#friend-'+index).hide();
    }
  });
}


// Set Template Events
Template.playlistsTemplate.events({
  'click .playlist': function (event, template) {
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
, 'click .playlist-remove': function (event, template) {
    $('#remove-playlist-modal')
      .on('shown', function(){
        $('#remove-playlist-submit').focus();
      })
      .modal();
    $('#remove-playlist-submit').attr('playlist', event.currentTarget.getAttribute('playlist'));
    return false;
  }
, 'click #remove-playlist-submit': function (event, template) {
    Meteor.call('removePlaylist', event.currentTarget.getAttribute('playlist'));
    $('#remove-playlist-modal').modal('hide');
  }
, 'click .playlist-share': function (event, template) {
    var $list = $('#share-users-list')
      , playlist = event.currentTarget.getAttribute('playlist')
      ;
    $('#filter-share-users-list').val('');
    $list.html('LOADING . . .');
    Meteor.call('getPlaylistFriendsSharing', playlist, function(err, res){
      Template.playlistsTemplate.friends = res;
      var result = ''
        , $list = $('#share-users-list')
        ;
      _.each(Template.playlistsTemplate.friends, function(friend, index){
        result += '<tr id="friend-'+index+'">'
                + '  <td style="text-align:right;">'
                + '    <input type="checkbox" id="friend-'+index+'-canAccess" '+(friend.canAccess?'checked ':'')+' />'
                + '  </td>'
                + '  <td><img src="http://graph.facebook.com/'+friend.id+'/picture" /></td>'
                + '  <td>'
                + '    '+friend.name
                + '  </td>'
                + '</tr>';
      });
      $list.html('<center><table>'+result+'</table></center>');
      Template.playlistsTemplate.filterFriends('');
    });
    $('#share-playlist-modal')
      .attr('playlist', playlist)
      .modal();
    return false;
  }
, 'keyup #filter-share-users-list': function (event, template) {
    Template.playlistsTemplate.filterFriends($('#filter-share-users-list').val());
  }
, 'click #share-playlist-submit': function (event, template) {
    var changes = [];
    _.each(Template.playlistsTemplate.friends, function(friend, index){
      if($('#friend-'+index+'-canAccess').is(':checked')!=friend.canAccess){
        changes.push({id:friend.id,status:!friend.canAccess});
      }
    });
    if(changes.length>0) {
      Meteor.call('sharePlaylist', $('#share-playlist-modal').attr('playlist'), changes);
    }
    $('#share-playlist-modal').modal('hide');
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
  },
  setPlaylist: function (playlist) {
    this.navigate('playlist/'+playlist, true);
  }
});

// instantiate router
var playlistsRouter = new PlaylistsRouter;
