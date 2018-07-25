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

  // divide delta by 2
  var D_DIV = 2

  console.log("Will divide delta by "+D_DIV)

  var epsilon = eps || 1e-8
  //var limit = 1000
  var limit = 50

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

    console.log(v1);

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
      res[i] = v[i]-delta[i][0]/D_DIV
    }

    return res

  }

  function sigma(v,n,r){

    var sum = 0
    var wsum = ws(v,n)

    for(var i=0;i<n;i++){
      sum += wn(i,v,wsum)*r(i,v)*r(i,v)
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
numbers.calculus.GaussNewton_forHeading = function(v,n,r,dr,eps,w){

  // degrees
  var STEP_SIZE_LIMIT = 10

  var epsilon = eps || 1e-8
  //var limit = 1000
  var limit = 50

  var stop = false
  var counter = 0
  var v0 = v

  if (w===undefined){
    w = function(){
      return 1;
    };
  }

  console.log("V0:")
  console.log(v0)

  while(!stop){

    counter++

    var v1 = iterate(v0,n,r,dr)

    rs0 = []
    rs1 = []
    diff = []

    var reiterate = false

    for(var i=0;i<n;i++){
      rs0.push(r(i,v0))
      rs1.push(r(i,v1))
      diff.push(r(i,v1)-r(i,v0))
    }

    console.log("V1:")
    console.log(v1)

    console.log("residuals old:")
    console.log(rs0)
    console.log("residuals new:")
    console.log(rs1)
    console.log("difference:")
    console.log(diff)

    var max = Math.max(...diff)
    var sscale = 1;

    if (max>STEP_SIZE_LIMIT){
      console.log("LAT or LON EXCEEDED STEP SIZE")
      sscale = STEP_SIZE_LIMIT/max;

    }

    if ((v1[2]-v0[2])>STEP_SIZE_LIMIT){
      console.log("DELTA HEADING EXCEEDED STEP SIZE")
      sscale = STEP_SIZE_LIMIT/(v1[2]-v0[2]);
    }

    if (sscale!=1){

      console.log("SCALE = "+sscale)

      for(var i=0;i<n;i++){
        v1[i] = v0[i]+sscale*(v1[i]-v0[i])
      }

      console.log("Corrected V1:")
      console.log(v1)

    }

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
    var wsum = ws(v,n)

    for(var i=0;i<n;i++){
      sum += wn(i,v,wsum)*r(i,v)*r(i,v)
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




// v   - is a vector of parameters
// n   - number of measurements
// r   - residual function
// dr  - partial derivatives
// eps - epsilon
// w   - weights

numbers.calculus.GaussNewton_nD = function(v,n,r,dr,eps,w){

  var epsilon = eps || 1e-8
  var limit = 1000

  var stop = false
  var counter = 0
  var v0 = v

  var xn = r.length;

  if (w===undefined){
    w = []
    for(var j=0;j<xn;j++){
      w.push(
        function(){
          return 1;
        }
      );
    }
  }

  while(!stop){

    counter++

    var v1 = iterate(v0,n,r,dr,w)

    //console.log(v1);

    var s0 = sigma(v0,n,r,w)
    var s1 = sigma(v1,n,r,w)

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
  function iterate(v,n,r,dr,w){

    var xn = r.length;

    var wsum = 0
    var J = []

    for(var j=0;j<xn;j++){
      wsum += ws(v,n,w[j])
      J = J.concat(jacobian(v,n,dr[j]))
    }

    console.log(J)

    var Jt = numbers.matrix.transpose(J)

    for(var j=0;j<xn;j++){
      for(var i=0;i<n;i++){
        J = numbers.matrix.rowScale(J,n*j+i,wn(i,v,wsum,w[j]))
      }
    }

    // JtJ
    J = numbers.matrix.multiply(Jt,J)

    // (Jt x J)^-1
    J = numbers.matrix.inverse(J)
    // (Jt x J)^-1 x Jt
    J = numbers.matrix.multiply(J,Jt)

    var V = []

    for(var j=0;j<xn;j++){
      for(var i=0;i<n;i++){
        V.push([wn(i,v,wsum,w[j])*r[j](i,v)])
      }
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

  function sigma(v,n,r,w){

    var xn = r.length;
    var sum = 0

    var wsum = 0;
    for(var j=0;j<xn;j++){
      wsum += ws(v,n,w[j])
    }


    for(var j=0;j<xn;j++){
      for(var i=0;i<n;i++){
        sum += wn(i,v,wsum,w[j])*r[j](i,v)*r[j](i,v)
        //wsum += w(i,v)
      }
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
  function wn(i,v,wsum,w){

    return w(i,v)/wsum

  }

  // sum of weights for normalization
  function ws(v,n,w){

    var wsum = 0

    for(var i=0;i<n;i++){
      wsum += w(i,v)
    }

    return wsum

  }

}
