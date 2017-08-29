/**
 * @file numbers.calculus.extra.js
 * @brief Gauss-Newton
 * @copyright Copyright (C) 2017 Elphel Inc.
 * @authors Oleg Dzhimiev <oleg@elphel.com>
 *
 * @license: GPL-3.0+
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 *   The JavaScript code in this page is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU
 *   General Public License (GNU GPL) as published by the Free Software
 *   Foundation, either version 3 of the License, or (at your option)
 *   any later version.  The code is distributed WITHOUT ANY WARRANTY;
 *   without even the implied warranty of MERCHANTABILITY or FITNESS
 *   FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 *   As additional permission under GNU GPL version 3 section 7, you
 *   may distribute non-source (e.g., minimized or compacted) forms of
 *   that code without the copy of the GNU GPL normally required by
 *   section 4, provided you include this license notice and a URL
 *   through which recipients can access the Corresponding Source.
 *
 *  @licend  The above is the entire license notice
 *  for the JavaScript code in this page.
 */

/**
 * Gauss-Newton algorithm for minimizing error function which
 * is a sum of squared errors for each measurement
 *
 * @v {Array} vector, initial approximation
 * @n {Number} number of measuments
 * @r {Function} residual function
 * @dr {Array} array of derivative functions
 * @eps {Number} precision
 *
 */
numbers.calculus.GaussNewton = function(v,n,r,dr,eps,w){

  var epsilon = eps || 1e-8
  var limit = 1000

  var stop = false
  var counter = 0
  var v0 = v

  if (w===undefined){
    w = function(){
      return 1;
    };
  }

  while(!stop){

    counter++

    var v1 = iterate(v0,n,r,dr)

    //console.log(v1);

    var s0 = sigma(v0,n,r)
    var s1 = sigma(v1,n,r)

    if((Math.abs(s1-s0)<epsilon)||(counter==limit)){
      stop = true
    }

    v0 = v1

  }

  return {
    count: counter,
    error: s1,
    v: v0
  }

  //functions
  function iterate(v,n,r,dr){

    var wsum = ws(v,n)

    var J = jacobian(v,n,dr)
    var Jt = numbers.matrix.transpose(J)

    for(var i=0;i<n;i++){
      J = numbers.matrix.rowScale(J,i,wn(i,v,wsum))
    }

    // JtJ
    J = numbers.matrix.multiply(Jt,J)

    // (Jt x J)^-1
    J = numbers.matrix.inverse(J)
    // (Jt x J)^-1 x Jt
    J = numbers.matrix.multiply(J,Jt)

    var V = []
    for(var i=0;i<n;i++){
      V.push([wn(i,v,wsum)*r(i,v)])
    }

    var delta = numbers.matrix.multiply(J,V)

    //console.log("delta: ");
    //console.log(delta);

    var res = []

    for(var i=0;i<v.length;i++){
      res[i] = v[i]-delta[i][0]
    }

    return res

  }

  function sigma(v,n,r){

    var sum = 0
    //var wsum = 0

    for(var i=0;i<n;i++){
      sum += wn(i,v)*r(i,v)*r(i,v)
      //wsum += w(i,v)
    }

    //console.log("sum = "+sum+" wsum = "+wsum);

    //sum = Math.sqrt(sum/wsum)
    sum = Math.sqrt(sum)

    return sum

  }

  function jacobian(v,n,dr){

    var J = []

    for(var i=0;i<n;i++){

      var row = []
      for(var j=0;j<dr.length;j++){
        row.push(dr[j](i,v))
      }
      J[i] = row

    }

    return J

  }

  // normalized weight
  function wn(i,v,wsum){

    return w(i,v)/wsum

  }

  // sum of weights for normalization
  function ws(v,n){

    var wsum = 0

    for(var i=0;i<n;i++){
      wsum += w(i,v)
    }

    return wsum

  }

}
