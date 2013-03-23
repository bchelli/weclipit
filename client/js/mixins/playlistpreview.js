
Template.playlistPreview.helpers({
  getList:function(){
    if(!this.thumbnails || !this.thumbnails.length){
      return [];
    }
    if(this.thumbnails.length<4){
      return [this.thumbnails[0]];
    }
    return this.thumbnails;
  }
, getClass:function(){
    return !this.thumbnails || !this.thumbnails.length || this.thumbnails.length<4 ? 'only-one' : '';
  }
});
