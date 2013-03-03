(function(){
  var $window = $(window);
  var resizeWindow = function(){
    var $shUsers = $('.shared-users')
      , shUsersPos = $shUsers.position()
      ;
    if($shUsers && shUsersPos){
      var h = $shUsers.height()
        , t = shUsersPos.top
        ;
      $('img', $shUsers).each(function(pos, el){
        var $el = $(el)
          , pos = $el.position()
          ;
        if(pos.top-t < h){
          $el.attr('src', $el.attr('data-src'));
        }
      });
    }
  };
  var resizeTO;
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(resizeWindow, 100);
  };
  Template.videosSharingTemplate.rendered = function() {
    $window.bind('resize', onResize);
    resizeWindow();
  };
  
  Template.videosSharingTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }
})();

// Set Template Helpers
Template.videosSharingTemplate.helpers({
  isMine: function () {
    return this.owner === Meteor.userId();
  }
, rightTo: function(right, playlist, myUser, videoOwner){
    var fbId = myUser && myUser.services && myUser.services.facebook && myUser.services.facebook.id ? myUser.services.facebook.id : 0
      , result = playlist.owner === myUser._id
      ;
    if(!result && playlist[right]) result = _.contains(playlist[right], fbId);
    if(!result && videoOwner) result = videoOwner === myUser._id;
    return result;
  }
});

Template.videosSharingTemplate.playlist = function() {
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
// Set Template Events
function setNewName(){
  var newName = $('#edit-playlist-name input').val();
  Meteor.call('updatePlaylistName', Session.get('playlist'), newName);
  $('#edit-playlist-name').hide();
  $('#playlist-name').html(newName).show();
}
Template.videosSharingTemplate.events({
  'click .playlist-remove': function (event, template) {
    $('#remove-playlist-modal')
      .on('shown', function(){
        $('#remove-playlist-submit').focus();
      })
      .modal();
    $('#remove-playlist-submit').attr('playlist', event.currentTarget.getAttribute('playlist'));
    return false;
  }
, 'click .playlist-edit': function (event, template) {
    $('#edit-playlist-name').show();
    $('#edit-playlist-name input').focus();
    $('#playlist-name').hide();
    return false;
  }
, 'click .cancel-playlist-name': function (event, template) {
    $('#edit-playlist-name').hide();
    $('#playlist-name').show();
    return false;
  }
, 'submit #edit-playlist-name': function (event, template) {
    setNewName();
    return false;
  }
, 'click .valid-playlist-name': function (event, template) {
    setNewName();
    return false;
  }
, 'click .playlist-share': function (event, template) {
    var $list = $('#share-users-list')
      , playlist = event.currentTarget.getAttribute('playlist')
      ;
    $('#filter-share-users-list').val('');
    $list.html('<h1 class="loading">LOADING . . .</h1>');
    Meteor.call('getPlaylistFriendsSharing', playlist, function(err, res){
      Template.videosTemplate.friends = res;
      var result = ''
        , $list = $('#share-users-list')
        ;
      _.each(Template.videosTemplate.friends, function(friend, index){
        result += '<tr id="friend-'+index+'">'
                + '  <td class="span1" style="text-align:center">'
                + '    <input type="checkbox" id="friend-'+index+'-canAccess" class="friend-canAccess" '+(friend.canAccess?'checked ':'')+' />'
                + '  </td>'
                + '  <td class="span1 friendToogle" data-index="'+index+'"><img src="http://graph.facebook.com/'+friend.id+'/picture" /></td>'
                + '  <td class="friendToogle" data-index="'+index+'">'
                + '    '+friend.name
                + '  </td>'
                + '</tr>';
      });
      $list.html('<table class="table table-striped table-condensed">'+result+'</table>');
      Template.videosTemplate.filterFriends('');
    });
    $('#share-playlist-modal')
      .attr('playlist', playlist)
      .modal();
    return false;
  }
});