numbers.matrix.toString = function(a){

  var res = ""

  for(var i=0;i<a.length;i++){
      res += a[i].join(" ")+"\n"
  }

  return res
}
