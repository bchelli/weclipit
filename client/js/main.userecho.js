Meteor.autorun(function(){
  window._ues = {
    host:'26plays.userecho.com',
    forum:'18120',
    lang:'en',
    tab_corner_radius:5,
    tab_font_size:20,
    tab_image_hash:'ZmVlZGJhY2s%3D',
    tab_chat_hash:'Y2hhdA%3D%3D',
    tab_alignment:'bottom',
    tab_text_color:'#FFFFFF',
    tab_text_shadow_color:'#00000055',
    tab_bg_color:'#0C9DB7',
    tab_hover_color:'#F45C5C'
  };
  
  (function() {
    var _ue = document.createElement('script'); _ue.type = 'text/javascript'; _ue.async = true;
    _ue.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'cdn.userecho.com/js/widget-1.4.gz.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(_ue, s);
  })();
});