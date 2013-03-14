
Template.setNameTemplate.events = {
  'submit form':function(){
    var name = $('#your-name').val();
    if(name.length<3){
      
    } else {
      Meteor.call('setName', name);
    }
    return false;
  }
};