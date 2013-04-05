formatTime = function(time){
  time = Math.floor(time);
  var sec = time % 60
    , min = Math.floor(time/60)
    ;
  if(sec<10) sec = '0'+sec;
  return min+':'+sec;
}
