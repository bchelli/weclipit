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
  rightTo: function(right, playlist, myUser, video){
    if(right === "isOwner") return playlists.isOwner(playlist, myUser);
    if(right === "canAccess") return playlists.canAccess(playlist, myUser);
    if(right === "canAddVideo") return playlists.canAddVideo(playlist, myUser);
    if(right === "canRemoveVideo") return playlists.canRemoveVideo(playlist, video, myUser);
    return false;
  }
, privateTo: function(type){
    return type === this.privacy;
  }
});
Template.videosSharingTemplate.playlist = function() {
  if(!Session.get('playlist')) return {};
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
Template.videosSharingTemplate.playlistUrl = function() {
  if(!Session.get('playlist')) return {};
  var pl = playlists.findOne({_id:Session.get('playlist')})
    , url = ''
    ;
  if(pl && pl._id) url = Meteor.absoluteUrl('playlist/'+pl._id);
  return url;
};
Template.videosSharingTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};

Template.videosSharingTemplate.events({
  'click .playlist-remove': function (event, template) {
    $('#remove-playlist-modal')
      .on('shown', function(){
        $('#remove-playlist-submit').focus();
      })
      .modal();
    $('#remove-playlist-submit').attr('playlist', event.currentTarget.getAttribute('playlist'));
    _gaq.push(['_trackEvent', 'playlist', 'remove']);
    return false;
  }
, 'click .playlist-follow': function (event, template) {
    Meteor.call('followPlaylist', event.currentTarget.getAttribute('playlist'));
    _gaq.push(['_trackEvent', 'playlist', 'follow']);
    return false;
  }
, 'click .set-privacy': function(){
    var privacy = event.currentTarget.getAttribute('data-privacy');
    Meteor.call('setPrivacy', Session.get('playlist'), privacy);
    _gaq.push(['_trackEvent', 'playlist', 'privacy', privacy]);
  }
, 'click .sharing-button': function(event){
    var $target=$(event.currentTarget)
      , typeSharing = $target.attr('data-type-sharing')
      , width=$target.attr('data-width')
      , height=$target.attr('data-height')
      , u=$target.attr('data-url')
      , t=$target.attr('data-title')
      , leftPosition = (window.screen.width / 2) - ((width / 2) + 10)   //Allow for borders.
      , topPosition = (window.screen.height / 2) - ((height / 2) + 50)  //Allow for title and status bars.
      , url
      ;
    switch(typeSharing){
      case 'facebook':
        url = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(u)+'&t='+encodeURIComponent(t);
        break;
      case 'twitter':
        url = 'https://twitter.com/intent/tweet?original_referer='+encodeURIComponent(u)+'&text='+encodeURIComponent(t)+'&tw_p=tweetbutton&url='+encodeURIComponent(u)+'&via=26plays';
        break;
      case 'google':
        url = 'https://plus.google.com/share?url='+encodeURIComponent(u);
        break;
      case 'email':
        url = 'mailto:?subject='+encodeURIComponent(t)+'&body='+encodeURIComponent(u);
        break;
    }
    if(url){
      window.open(
        url
      , 'sharer'
      , "status=no,height=" + height + ",width=" + width + ",resizable=yes,left=" + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY=" + topPosition + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no"
      );
      event.preventDefault();
    }
    _gaq.push(['_trackEvent', 'playlist', 'share', typeSharing]);
  }
});