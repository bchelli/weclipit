
Template.mainContentTemplate.helpers({
  isPage:function(page){
    return Session.get('page') === page;
  }
});

Template.mainContentTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return !!pl && pl.playlist === Session.get('playlist');
};
