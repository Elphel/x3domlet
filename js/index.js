$(function(){

    //init();
    
    $.ajax({
        
        url: "list.php",
        success: function(response){
            
            parse_list(response);
            
        }
        
    });
    
});

function parse_list(res){
    
    $(res).find("model").each(function(){
        
        var row = $("<tr>");
        var name = $(this).attr("name");
        
        row.append("<td valign='top'>"+name+"</td>");
        
        var vlist = "";
        var rlist = "";
        $(this).find("version").each(function(){
            
            var link_url = "test.html?path="+name+"&ver="+$(this).attr("name");
            var link = "<a href='"+link_url+"'>"+$(this).attr("name")+"</a>";
            
            vlist += "<div>"+link+"</div>";
            
            link_url = "models/"+name+"/"+$(this).attr("name")+"/README.txt";
            link = "<a href='"+link_url+"'>readme.txt</a>";
            
            rlist += "<div>"+link+"</div>";
        });
        
        row.append("<td valign='top'>"+vlist+"</td>");
        row.append("<td valign='top'>"+rlist+"</td>");
        
        $("#model_table").append(row);
        
    });
    
    
    
}
