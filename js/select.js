
$(function(){

    var url = 'select.php';

    $.ajax({

        url: url,
        success: function(response){

            List = response;
            parse_list(response);

        }

    });

    $('.copy').on('click',function(e){
      copy_models();
    });

});

function parse_list(res){

  $(res).find("set").each(function(){

    var name = $(this).attr("name");
    var mlist = $("<ul>",{id:"s_"+name});

    $("#content").append("<h3>"+name+"</h3>").append(mlist);

    $(this).find("model").each(function(){

      var mname = $(this).attr("name");
      var basepath = 'models/_all/'+name;

      var item = [
        '<li>',
        ' <input type=\'checkbox\' class=\'chkbox\' set=\''+name+'\' model=\''+mname+'\'/>',
        '  <a href=\'viewer.html?basepath='+basepath+'&path='+mname+'\'>'+mname+'</a>',
        '</li>'
      ].join('\n');

      mlist.append($(item));

    });

  });

}

function copy_models(){

  // testing
  $.ajax({
    url: "select.php?cmd=copy",
    success: function(response){
      console.log(response);
    }
  });

  $(".chkbox").each(function(){

    if ($(this).prop("checked")){
      $.ajax({
        url: "select.php?cmd=copy&set="+$(this).attr('set')+"&model="+$(this).attr('model'),
        type:'post',
        data: $('#kml')[0].files[0],
        processData: false,
        success: function(response){
          console.log(response);
        }
      });
    }

  });

}