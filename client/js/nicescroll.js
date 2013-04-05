function getScrollBarWidth() {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild (inner);

  document.body.appendChild (outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild (outer);

  return (w1 - w2);
};

function updateScrollbars($el, $bar){
  if($el[0].scrollHeight <= $el.height()){
    $bar.css({
      'display':'none'
    })
  } else {
    var barHeight = $el.height() / $el[0].scrollHeight;
    var position = (1 - barHeight) * $el.scrollTop() / ($el[0].scrollHeight - $el.height());
    $bar.css({
      'display':'block'
    , 'height': Math.floor($el.height() * barHeight)
    , 'top': Math.floor($el.scrollTop() + $el.height() * position)
    });
  }
}

function generateNicescroll($el){
  if($el.attr('nicescroll')!=='inited'){
    $el.attr('nicescroll', 'inited');
    $el.css({'overflow':'hidden','position':'relative'});
    $el.append('<div class="bar" />');
    var $bar = $el.find('.bar');
    $bar.css({
      'position':'absolute'
    , 'right':'3px'
    , 'width':'6px'
    , 'background':'#000'
    , 'top':0
    , 'border-radius':'3px'
    , 'opacity':0
    }).mousedown(function(ev){
      $bar.attr('niscescroll-drag', 'active');
      $bar.attr('niscescroll-drag-position', ev.clientY);
      $bar.attr('niscescroll-drag-scroll-top', $el.scrollTop());
      ev.preventDefault();
    });
    $('body').mouseup(function(ev){
      if($bar.attr('niscescroll-drag') === 'active') {
        $bar.attr('niscescroll-drag', '');
        ev.preventDefault();
      }
    }).mousemove(function(ev){
      if($bar.attr('niscescroll-drag') === 'active') {
        var top = parseFloat($bar.attr('niscescroll-drag-position'));
        var init = parseFloat($bar.attr('niscescroll-drag-scroll-top'));
        $el.scrollTop(init+$el[0].scrollHeight*(ev.clientY-top)/$el.height());
        updateScrollbars($el, $bar);
        ev.preventDefault();
      }
    });
    $el.mousewheel(function(ev, velocity){
      // scroll
      var init = $el.scrollTop();
      $el.scrollTop(init-velocity*20);
      var end = $el.scrollTop();
      if(init!==end) ev.preventDefault();

      updateScrollbars($el, $bar);
    }).mouseover(function(ev){
      $bar.stop().animate({
        'opacity':0.5
      }, 'fast');
    }).mouseout(function(ev){
      $bar.stop().animate({
        'opacity':0
      }, 'slow');
    });
  }
  function updtScrll(){
    updateScrollbars($el, $el.find('.bar'));
  }
  updtScrll();
  setTimeout(updtScrll, 100);
  setTimeout(updtScrll, 1000);
}

var elementsToScroll = [];
setNicescroll = function(selector){
  elementsToScroll.push(selector);
}

$(function(){
  if(getScrollBarWidth()===0){
    setNicescroll = function(){};
  } else {
    setNicescroll = function(selector){
      var $els = $(selector);
      for(var i=0,l=$els.length;i<l;i++){
        var $el = $($els[i]);
        
        // create Nice Scroll
        generateNicescroll($el);
    
      }
    };
    var selector;
    while(selector = elementsToScroll.shift()){
      setNicescroll(selector);
    }
  }
});
