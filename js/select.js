
$(function(){

    var url = 'select.php';

    $.ajax({

        url: url,
        success: function(response){

            List = response;
            parse_list(response);

        }

    });

});

function parse_list(res){

  $(res).find("set").each(function(){

    var name = $(this).attr("name");
    var mlist = $("<ul>",{id:"s_"+name});

    $("#content").append("<h3>"+name+"</h3>").append(mlist);

    $(this).find("model").each(function(){

      var mname = $(this).attr("name");

      var item = [
        '<li>',
        '  <a href=\'viewer.html?basepath=models/_all/'+name+'&path='+mname+'\'>'+mname+'</a>',
        '</li>'
      ].join('\n');

      mlist.append($(item));

    });

  });

}