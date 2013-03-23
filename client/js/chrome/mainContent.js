
Template.mainContentTemplate.isPlaying = function(){
  var pl = Session.get('playing');
  return !!pl && pl.playlist === Session.get('playlist');
};
