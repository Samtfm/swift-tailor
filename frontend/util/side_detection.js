import jsfeat from 'jsfeat';
import { faceClassifier } from './face_classifier';
// import { handClassifier } from './upperbody';

export const detectSide = (imageData, face, wingspan) => {
  face = face || {x: Math.floor(imageData.cols/2), y: 0, width: 100 };


  const bust = measureWidth(imageData, {
    x: Math.floor(face.x - face.width*.5),
    y: Math.floor(face.y + wingspan*.28),
    width: face.width*2,
    height: wingspan*.02
  });
  const stomach = measureWidth(imageData, {
    x: Math.floor(face.x - face.width*.5),
    y: Math.floor(face.y + wingspan*.42),
    width: face.width*2,
    height: wingspan*.02
  });
  return { bust, stomach };
  // return chest.points.concat(arms.points).concat(neck.points);
};

const measureWidth = (imageData, box) => {
  // const height = imageData.rows;
  const x = box.x;
  const y = box.y;
  const width = box.width;
  const height =box.height;

  const leftPoints = traceLineDown(
    imageData,
    {
      startPos: { x: x, y: y},
      endPos: {x: x, y: y + height },
      direction: -1
    });
  const rightPoints = traceLineDown(
    imageData,
    {
      startPos: { x: x + width, y },
      endPos: {x: x + width, y: y + height},
      direction: 1
    });

  let leftSum = 0;
  let leftMax = null;
  let leftMin = null;
  leftPoints.forEach(point => {
    leftSum += point.x;
    if (leftMax === null || point.x > leftMax){
      leftMax = point.x;
    }
    if (leftMin === null || point.x < leftMin){
      leftMin = point.x;
    }
  });
  const leftAvg = leftSum/leftPoints.length;

  let rightSum = 0;
  let rightMax = null;
  let rightMin = null;
  rightPoints.forEach(point => {
    rightSum += point.x;
    if (rightMax === null || point.x > rightMax){
      rightMax = point.x;
    }
    if (rightMin === null || point.x < rightMin){
      rightMin = point.x;
    }
  });
  const rightAvg = rightSum/rightPoints.length;
  return {
    points: leftPoints.concat(rightPoints),
    average: rightAvg - leftAvg,
    mininum: rightMin - leftMax,
    maximum: rightMax - leftMin
  };
};

const traceLineDown = (imageData, {startPos, endPos, direction}) => {
  direction = direction || 1;
  const height = imageData.rows;
  const width = imageData.cols;
  const points = [];
  let tolerance = 5;

  let prevEdge = startPos.x;
  for (let y = startPos.y; y < endPos.y; y++) {

    //slice from start of collumn to end of row
    const rowStart = y*width; // calculate start of row
    let edge;
    //check right edge
    for (let offset = -tolerance; offset < tolerance; offset++){
      let x = prevEdge + offset*direction;
      const value = parseInt(imageData.data[rowStart+x]); // add offset from prev rows
      if (value > 0) {
        edge = x; // reasign until edge of frame
      }
    }
    if (edge){
      points.push({x: edge, y});
      tolerance = 5;
      prevEdge = edge + Math.floor((edge-prevEdge)/2);
    } else {
      if (tolerance < 50) {
        // try iteration again with a higher tolerance
        tolerance = Math.ceil(tolerance*1.5);
        y--;
      } else {
        //move on to next row.
        edge = startPos.x;
        tolerance = 50;
      }
    }
  }
  return points;
};

export const detectFace = (ctx, options) => {
  // Attempt to find face;

  // iiSum         - integral of the source image
  // iiSqsm       - squared integral of the source image
  // iiTilted      - tilted integral of the source image
  // iiCanny_sum   - integral of canny source image or undefined
  // width           - width of the source image
  // height          - height of the source image
  // classifier      - haar cascade classifier
  // scale_factor    - how much the image size is reduced at each image scale
  // scale_min       - start scale
  // rects           - rectangles representing detected object
  let w = ctx.canvas.width;
  let h = ctx.canvas.height;
  let classifier = faceClassifier;
  let imageData = ctx.getImageData(0, 0, w, h);
  let imgU8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
  let iiSum = new Int32Array((w+1)*(h+1));
  let iiSqsm = new Int32Array((w+1)*(h+1));
  let iiTilted = new Int32Array((w+1)*(h+1));
  let iiCanny = new Int32Array((w+1)*(h+1));

  jsfeat.imgproc.grayscale(imageData.data, w, h, imgU8);
  jsfeat.imgproc.compute_integral_image(
    imgU8,
    iiSum,
    iiSqsm,
    classifier.tilted ? iiTilted : null
  );
  jsfeat.haar.edges_density = 0.2;
  var rects = jsfeat.haar.detect_multi_scale(
    iiSum, iiSqsm, iiTilted,
    options.use_canny? iiCanny : null,
    imgU8.cols,
    imgU8.rows,
    classifier,
    options.scale_factor,
    options.min_scale
  );

  // draw only most confident one
  rects = jsfeat.haar.group_rectangles(rects, 1);
  let scale = w / imgU8.cols;
  let face = getFace(ctx, rects, scale, 1);
  return {face, scale};
};

function getFace(ctx, rects, sc, max) {
  var on = rects.length;
  if(on && max) {
    jsfeat.math.qsort(rects, 0, on-1, function(a,b){
      return (b.confidence<a.confidence);
    });
  }
  var n = max || on;
  n = Math.min(n, on);
  var r;
  for(var i = 0; i < n; ++i) {
      r = rects[i];

  }
  return r;
}

export const drawFace = (ctx, r, sc) => {
  ctx.strokeStyle="white";
  ctx.lineWidth="2";
  return ctx.strokeRect((r.x*sc)|0,(r.y*sc)|0,(r.width*sc)|0,(r.height*sc)|0);
};
