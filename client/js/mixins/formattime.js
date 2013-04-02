
// Set Template Helpers
Template.formatTimeAgo.helpers({
  formatTimeAgo: function(time){
    Session.get('tick-min');
    var delta = (new Date()).getTime() - time;
    if(_.isNaN(delta)) return '?';
    if(delta <= 1000*60) return 'few seconds'
    if(delta >= 1000*60*60*24*365) return Math.floor(delta / (1000*60*60*24*365))+' year(s)';
    if(delta >= 1000*60*60*24*30) return Math.floor(delta / (1000*60*60*24*30))+' month(s)';
    if(delta >= 1000*60*60*24) return Math.floor(delta / (1000*60*60*24))+' day(s)';
    if(delta >= 1000*60*60) return Math.floor(delta / (1000*60*60))+' hour(s)';
    return Math.floor(delta / (1000*60))+' minute(s)';
  }
});