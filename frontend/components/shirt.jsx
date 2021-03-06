import React from 'react';
import SVG from 'svg.js';
import {
  calcShirtLines,
  calcSleeveLines,
  neckline,
  parseLines
} from '../util/clothing';

class Shirt extends React.Component{

  constructor(props){
    super(props);
    this.shirtScale = 100/8;
    this.shirtDrawn = false;
    this.state = {
      inchMeasurements: {},
      pixelMeasurements: {}
    };
  }
  componentDidMount(){
    // this.draw = SVG(this.drawing).size(600,500);
  }
  componentWillReceiveProps(newProps){
    if (newProps.inchMeasurements){
      const pixelMeasurements = {};
      for (var key in newProps.inchMeasurements) {
        pixelMeasurements[key] = newProps.inchMeasurements[key] * this.shirtScale;
      }
      this.setState({ pixelMeasurements });
    }
  }

  drawShirt(){
    // const group = this.draw.group();
    const fill = this.props.pattern;
    const sc = this.shirtScale;
    const { pixelHeight,
      chestWidth, waistWidth,
      shirtLength, shoulderWidth,
      neckWidth, armHole
    } = this.state.pixelMeasurements;

    if (!(chestWidth && neckWidth && shirtLength)) return;
    let torsoLines = calcShirtLines(
      chestWidth, shirtLength,
      armHole, shoulderWidth,
      neckWidth, waistWidth);
      let wholeShirt = parseLines(torsoLines).join(" ");
    let sleeveLines = calcSleeveLines(armHole, shirtLength);
    let sleeves = parseLines(sleeveLines).join(" ");
    let neckLine = neckline(neckWidth);
    // console.log(wholeShirt);
    // var pattern = this.draw.pattern(20, 20, function(add) {
    //   add.rect(20,20).fill('#f06');
    //   add.rect(10,10).fill('#0f9');
    //   add.rect(10,10).move(10,10).fill('#fff');
    // });

    // group.add(this.draw
    //   .path(wholeShirt)
    //   .fill(fill)
    //   .stroke({ width: 1 })
    // );
    // let temp = this.draw
    //   .path(sleeves)
    //   .rotate(90);
    // temp.fill(fill).stroke({ width: 1 });
    // group.add(temp);
    // // lines.push(["L", [0,0], [0,length]]);
    // const lengthText = this.draw.text(`${this.props.inchMeasurements.shirtLength}'`);
    // lengthText.transform({ x: -140, y: shirtLength/2});
    // group.add(lengthText);
    //
    // const widthText = this.draw.text(`${this.props.inchMeasurements.waistWidth/2}'`);
    // widthText.transform({ x: 0, y: shirtLength});
    // group.add(widthText);
    //
    // group.transform({x: 250, y: 50});

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let shirtStroke = new Path2D(wholeShirt);
    let sleeveStroke = new Path2D(sleeves);
    let neckStroke = new Path2D(neckLine);
    console.log(neckLine);
    console.log(neckStroke);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // load pattern
    var patImage = new Image();
    patImage.src = fill;

    patImage.onload = function(){
      // clear the previous canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // make background white
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fill();
      // shift center location
      ctx.translate(180,40);
      // draw shirt and sleeves
      let pat = ctx.createPattern(patImage, "repeat");
      ctx.fillStyle = pat;
      ctx.fill(shirtStroke);
      ctx.fill(sleeveStroke);
      // reset canvas location
      ctx.translate(-180,-40);
      drawGrid();
      ctx.translate(180,40);
      ctx.strokeStyle = 'black';
      ctx.stroke(shirtStroke);
      ctx.stroke(neckStroke);
      ctx.stroke(sleeveStroke);
    };

    const drawGrid = () => {
      var w = canvas.width;
      var h = canvas.height;
      var p = 5; // padding;

      for (var i = 0; i < w ; i += sc) {
        ctx.moveTo(0.5+i+p, p);
        ctx.lineTo(0.5+i+p, h + p);
      }
      for (var j = 0; j < h ; j += sc) {
        ctx.moveTo(p, 0.5+p + j);
        ctx.lineTo(w+p, 0.5+j + p);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'lightgray';
      ctx.stroke();
    };
    // return group;
  }

  render(){
    // if (this.drawing){
    //   this.shirt = this.shirt ? this.shirt.replace(this.drawShirt()) : this.drawShirt();
    // }
    const {height, neck, chest, waist} = this.state.pixelMeasurements;
    if(this.props.recording === false) this.drawShirt();

    return(
      <div className='shirt'>
        <canvas id="canvas" width='550' height='500'></canvas>
      </div>
    );
  }
}

export default Shirt;
//   <div ref={(component) => { this.drawing = component; }}></div>
