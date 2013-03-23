
Template.userPlaylistsTemplate.playlists = function(){
  var u = Session.get('userData');
  if(u){
    return u.playlists;
  }
};

Template.userPlaylistsTemplate.helpers({
  stackClass:function(){
    var stack = ['stack-one', 'stack-two', 'stack-three'];
    return stack[Math.floor(Math.random()*999) % 3];
  }
});

Template.userPlaylistsTemplate.events({
  'click .open-playlist': function(event){
    var $target=$(event.currentTarget);
    playlistsRouter.setPlaylist($target.attr('data-playlist-id'));
    return false;
  }
, 'click .open-user': function (event, template) {
    var $target=$(event.currentTarget);
    usersRouter.openUser($target.attr('data-user-id'));
    return false;
  }
});

Template.userPlaylistsTemplate.rendered = function(){
  $('img').each(function(){
    $el = $(this);
    if($el.attr('data-src')) $el.attr('src', $el.attr('data-src'));
  })
};
