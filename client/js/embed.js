
setEmbed = function(){
  $('body').addClass('embed');
  Session.set('embed', new Date());
}

isEmbedPath = function(){
  return Session.get('embed') ? 'embed/' : '';
}
