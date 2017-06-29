
function help_init(){

    /*
    var help_content = `
<div>
<table>
<tr>
    <td>asdfasdfadfasdfasdfasfHelp!</td>
</tr>
</table>
</div>
`;

    var help = $("<div>",{id:"help-content"}).css({
        display:"none"
    }).html(help_content);
    */

    var help = $("#help-content");

    help.hide();

    $("#help_button").on("click",function(){
        help.show();
    });

    help.on('click',function(){
        help.hide();
    });

}