

var Embed = function(){

  /*
   * PRIVATE
   */
  var pfx = ["webkit", "moz", "ms", "o", ""];
  function RunPrefixMethod(obj, method) {
    var p = 0, m, t;
    while (p < pfx.length && !obj[m]) {
      m = method;
      if (pfx[p] == "") {
        m = m.substr(0,1).toLowerCase() + m.substr(1);
      }
      m = pfx[p] + m;
      t = typeof obj[m];
      if (t != "undefined") {
        pfx = [pfx[p]];
        return (t == "function" ? obj[m]() : obj[m]);
      }
      p++;
    }
  }

  function showIHM(){
    var $els = $('.embed .hide-show');
    $els.each(function(){
      var $el = $(this);
      if(!$el.attr('open')){
        $el
          .attr('open', true)
          .stop()
          .animate({opacity:1}, 'fast')
          .addClass('displayed')
          ;
      }
    });
    Meteor.clearTimeout(nomoveTO);
    nomoveTO = Meteor.setTimeout(hideIHM, 5000);
  }
  function hideIHM(){
    var $els = $('.embed .hide-show');
    $els.each(function(){
      var $el = $(this);
      if($el.attr('open')){
        $el
          .removeAttr('open', true)
          .stop()
          .animate({opacity:0}, 'slow')
          .removeClass('displayed')
          ;
      }
    });
  }

  var fullscreenElement
    , nomoveTO
    ;


  /*
   * PUBLIC
   */
  this.toogleFullscreen = function() {
    if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
      RunPrefixMethod(document, "CancelFullScreen");
    } else {
      RunPrefixMethod(fullscreenElement, "RequestFullScreen");
    }
  };

  this.activateEmbed = function(){
    if(!this.isEmbedActivated()){
      fullscreenElement = document.getElementsByTagName('body')[0];
      $('body').addClass('embed');
      $('body').on('mousemove', showIHM);
      showIHM();
      Session.set('embed', new Date());
    }
  };

  this.isEmbedPath = function(){
    return Session.get('embed') ? 'embed/' : '';
  };

  this.isEmbedActivated = function(){
    Session.get('embed');
    return $('body').hasClass('embed');
  };

};

embed = new Embed;
