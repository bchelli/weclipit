
Template.userPlaylistsTemplate.playlists = function(){
  return playlists.find({owner:Session.get('user'),public:true}, {sort:{name:1}});
};

Template.userPlaylistsTemplate.ownerObj = function(uId){
  return Meteor.users.findOne({_id:uId});
};

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
