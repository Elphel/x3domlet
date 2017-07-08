/*
*! -----------------------------------------------------------------------------**
*! FILE NAME  : modify_kml.js
*! DESCRIPTION: Sends modified map data to the server
*! Copyright (C) 2011 Elphel, Inc.
*!
*! -----------------------------------------------------------------------------**
*!
*!  This program is free software: you can redistribute it and/or modify
*!  it under the terms of the GNU General Public License as published by
*!  the Free Software Foundation, either version 3 of the License, or
*!  (at your option) any later version.
*!
*!  This program is distributed in the hope that it will be useful,
*!  but WITHOUT ANY WARRANTY; without even the implied warranty of
*!  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*!  GNU General Public License for more details.
*!
*!  You should have received a copy of the GNU General Public License
*!  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*! -----------------------------------------------------------------------------**
*!
*/
function generateKML(nodes){

    var return_string = "<kml xmlns='http://earth.google.com/kml/2.2'>\n<Document>\n";

    for(var i in nodes) {
      return_string += [
        '<PhotoOverlay>',
        '   <name>'+nodes[i].name+'</name>',
        '   <description>'+nodes[i].description+'</description>',
        '   <visibility>'+(nodes[i].visibility?1:0)+'</visibility>',
        '   <Camera>',
        '     <longitude>'+nodes[i].longitude+'</longitude>',
        '     <latitude>'+nodes[i].latitude+'</latitude>',
        '     <altitude>'+nodes[i].altitude+'</altitude>',
        '     <heading>'+nodes[i].heading+'</heading>',
        '     <tilt>'+nodes[i].tilt+'</tilt>',
        '     <roll>'+nodes[i].roll+'</roll>',
        '   </Camera>',
        '   <Icon>',
        '     <href>'+nodes[i].href+'</href>',
        '   </Icon>'].join('\n');

      if (typeof(nodes[i].v3d)!='undefined') {

        return_string += [
        '   <ExtendedData>',
        '     <Visibility3d>'].join('\n');

        for (var j in nodes[i].v3d) {

          return_string +=
          '       <v3Range>';

          if (typeof(nodes[i].v3d[j].from)!='undefined'){
            return_string +=
              '        <from>'+nodes[i].v3d[j].from+'</from>';
          }
          if (typeof(nodes[i].v3d[j].to)  !='undefined'){
            return_string +=
              '        <to>'+  nodes[i].v3d[j].to+  '</to>';
          }

          return_string +=
          '       </v3Range>';

	}

        return_string += [
          '     </Visibility3d>',
          '   </ExtendedData>'].join('\n');
      }

        return_string += [
          '',
          '</PhotoOverlay>'].join('\n');
    }

    return_string +=
      '\n</Document>\n</kml>';

    return return_string;

}

function postKmlData(filename, xml) {
    $.ajax({
        url: "modify_kml.php?kml="+filename,
        type: "POST",
        dataType: "xml",
        data: xml,
	async:true,
        complete: function(response){
          //do nothing
        },
        contentType: "text/xml; charset=\"utf-8\""
    });
}