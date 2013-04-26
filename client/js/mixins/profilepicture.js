
Template.profilePictureSharing.rendered = function(){
  $(this.find('img')).tooltip();
};

var ev = {
  'error img':function(ev, tmpl){
    $(ev.currentTarget).attr('src', '/img/logo-200px.png');
  }
};

Template.profilePictureSharing.events(ev);
Template.profilePicture.events(ev);
Template.profilePictureLarge.events(ev);
