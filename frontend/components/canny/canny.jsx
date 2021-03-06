import React from 'react';
import jsfeat from 'jsfeat';
import compatibility from '../../util/compatibility';
import profiler from '../../util/profiler';

class Canny extends React.Component{
  constructor(props){
    super(props);
  }

  componentDidMount(){

    //This is all for video capturing, something we don't need in this section.
    var video = document.getElementById('webcam');
    var canvas = document.getElementById('canvasWebCanny');
    var canvasW = canvas.width;
    var canvasH = canvas.height;

    try {
        var attempts = 0;
        var readyListener = function(event) {
            findVideoSize();
        };
        var findVideoSize = function() {
            if(video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener('loadeddata', readyListener);
                onDimensionsReady(video.videoWidth, video.videoHeight);
            } else {
                if(attempts < 10) {
                    attempts++;
                    setTimeout(findVideoSize, 200);
                } else {
                    onDimensionsReady(canvasW, canvasH);
                }
            }
        };
        var onDimensionsReady = function(width, height) {
            demo_app(width, height);
            compatibility.requestAnimationFrame(tick);
        };

        video.addEventListener('loadeddata', readyListener);
        compatibility.getUserMedia({video: true}, function(stream) {
            try {
                video.src = compatibility.URL.createObjectURL(stream);
            } catch (error) {
                video.src = stream;
            }
            setTimeout(function() {
                    video.play();
                }, 500);
        }, function (error) {
            $('#canvas').hide();
            $('#log').hide();
            $('#no_rtc').html('<h4>WebRTC not available.</h4>');
            $('#no_rtc').show();
        });
    } catch (error) {
      console.log(error);
        $('#canvas').hide();
        $('#log').hide();
        $('#no_rtc').html('<h4>Something goes wrong...</h4>');
        $('#no_rtc').show();
    }

    var stat = new profiler();              // stat loads the canny properties
    var gui;                                // gui loads the toggle menu on the right corner;
    let options;                            // options calls on demo_opt canny load params;
    let ctx = canvas.getContext('2d');      // context for canvas;
    var img_u8;                             // img_u8 is the jsfeat matrix item
                                            // img_u8 holds the image as a matrix of rows and columns;

    var demo_opt = function(){
        this.blur_radius = 2;
        this.low_threshold = 20;
        this.high_threshold = 50;
    };

    function demo_app(videoW, videoH) {

        ctx.fillStyle = "rgb(0,255,0)";
        ctx.strokeStyle = "rgb(0,255,0)";

        img_u8 = new jsfeat.matrix_t(videoW, videoH, jsfeat.U8C1_t);
        //not sure what U8C1_t is but it is a single channel data_type
        options = new demo_opt();
        gui = new dat.GUI();

        gui.add(options, 'blur_radius', 0, 4).step(1);
        gui.add(options, 'low_threshold', 1, 127).step(1);
        gui.add(options, 'high_threshold', 1, 127).step(1);

        stat.add("grayscale");
        stat.add("gauss blur");
        stat.add("canny edge");
    }

    function tick() {
        compatibility.requestAnimationFrame(tick);
        stat.new_frame();

        //if the video is ready start applying filters to the image;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvasW, canvasH);
            var imageData = ctx.getImageData(0, 0, canvasW, canvasH);

            stat.start("grayscale");
            jsfeat.imgproc.grayscale(imageData.data, canvasW, canvasH, img_u8);
            stat.stop("grayscale");

            var r = options.blur_radius|0;
            var kernel_size = (r+1) << 1;

            stat.start("gauss blur");
            jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);
            stat.stop("gauss blur");

            stat.start("canny edge");
            jsfeat.imgproc.canny(img_u8, img_u8, options.low_threshold|0, options.high_threshold|0);
            stat.stop("canny edge");

            // render result back to canvas
            var data_u32 = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = img_u8.cols*img_u8.rows, pix = 0;
            while(--i >= 0) {
                pix = img_u8.data[i];
                data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }

            ctx.putImageData(imageData, 0, 0);

            $('#log').html(stat.log());
        }
    }

    $(window).unload(function() {
        video.pause();
        video.src=null;
    });
  }

  render(){

    let videoStyle = {
      display: 'none',
      width: '480px',
      height: '360px'
    };

    return (
      <div>
        <h1>SECTION FOR CALCULATIONS</h1>
        <video id="webcam" autoPlay="true" style={videoStyle}></video>
        <section className="calc-section">
          <canvas id="canvasWebCanny" width="480" height="360"></canvas>
          <canvas id="calcCanvas" width="480" height="360"></canvas>
        </section>
        <div id="log" className="alert alert-info"></div>
      </div>
    );
  }

}

export default Canny;
