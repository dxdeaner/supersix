<!-- Container div -->

</div>
</div>

<!-- Container div End Here -->
<!-- Footer Start Here -->

<footer id="footer-bar" class="row">
<p id="footer-copyright" class="col-xs-12">
Powered by <a href="http://www.f5buddy.com" target="_blank" style="color: #000; text-decoration: none;"><b>Super Six</b></a>
</p>
</footer>
</div>

</div>
</div>
</div>
<div id="config-tool" class="closed">
<a id="config-tool-cog">
<i class="fa fa-cog"></i>
</a>
<div id="config-tool-options">
<h4>Layout Options</h4>
<ul>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-header"/>
<label for="config-fixed-header">
Fixed Header
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-sidebar"/>
<label for="config-fixed-sidebar">
Fixed Left Menu
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-footer"/>
<label for="config-fixed-footer">
Fixed Footer
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-boxed-layout"/>
<label for="config-boxed-layout">
Boxed Layout
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-rtl-layout"/>
<label for="config-rtl-layout">
Right-to-Left
</label>
</div>
</li>
</ul>
<br/>
<h4>Skin Color</h4>
<ul id="skin-colors" class="clearfix">
<li>
<a class="skin-changer" data-skin="theme-navyBlue" data-toggle="tooltip" title="Navy Blue" style="background-color: #34495e;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-white" data-toggle="tooltip" title="White/Green" style="background-color: #2ecc71;">
</a>
</li>
<li>
<a class="skin-changer blue-gradient" data-skin="theme-blue-gradient" data-toggle="tooltip" title="Gradient">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-greenSea" data-toggle="tooltip" title="Green Sea" style="background-color: #6ff3ad;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-amethyst" data-toggle="tooltip" title="Amethyst" style="background-color: #9b59b6;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-blue" data-toggle="tooltip" title="Blue" style="background-color: #7FC8BA;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-red" data-toggle="tooltip" title="Red" style="background-color: #e74c3c;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-whbl" data-toggle="tooltip" title="White/Blue" style="background-color: #1ABC9C;">
</a>
</li>
</ul>
</div>
</div>
 
<script src="<?php echo base_url('assets/js/demo-skin-changer.js')?>"></script>  
<script src="<?php echo base_url('assets/js/jquery.js')?>"></script>
<script src="<?php echo base_url('assets/js/bootstrap.js')?>"></script>
<script src="<?php echo base_url('assets/js/jquery.nanoscroller.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/demo.js')?>"></script>  

<script src="<?php echo base_url('assets/js/jquery.scrollTo.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/jquery.slimscroll.min.js')?>"></script> 
<script src="<?php echo base_url('assets/js/moment.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/jquery-jvectormap-1.2.2.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/jquery-jvectormap-world-merc-en.js')?>"></script>
<script src="<?php echo base_url('assets/js/gdp-data.js')?>"></script>
<script src="<?php echo base_url('assets/js/flot/jquery.flot.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/flot/jquery.flot.resize.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/flot/jquery.flot.time.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/flot/jquery.flot.threshold.js')?>"></script>
<script src="<?php echo base_url('assets/js/flot/jquery.flot.axislabels.js')?>"></script>
<script src="<?php echo base_url('assets/js/jquery.sparkline.min.js')?>"></script>
<script src="<?php echo base_url('assets/js/skycons.js')?>"></script>

<script src="<?php echo base_url('assets/js/raphael-min.js')?>"></script>
<script src="<?php echo base_url('assets/js/morris.js')?>"></script>
<script src="<?php echo base_url('assets/js/scripts.js')?>"></script>
<script src="<?php echo base_url('assets/js/pace.min.js')?>"></script>


 
 
<script src="<?php echo base_url();?>assets/js/jquery.maskedinput.min.js"></script>

<script src="<?php echo base_url();?>assets/js/bootstrap-datepicker.js"></script>

<script src="<?php echo base_url();?>assets/js/daterangepicker.js"></script>

<script src="<?php echo base_url();?>assets/js/bootstrap-timepicker.min.js"></script>

<script src="<?php echo base_url();?>assets/js/select2.min.js"></script>

<script src="<?php echo base_url();?>assets/js/hogan.js"></script>

<script src="<?php echo base_url();?>assets/js/typeahead.min.js"></script>
<script src="<?php echo base_url();?>assets/js/jquery.pwstrength.js"></script>



<script src="<?php echo base_url();?>assets/js/bootstrap-wysiwyg.js"></script>
<script src="<?php echo base_url();?>assets/js/jquery.hotkeys.js"></script>

<script src="<?php echo base_url();?>assets/js/jquery-3.1.1.js"></script>
<script src="<?php echo base_url();?>assets/js/ckeditor/ckeditor.js"></script>



 <script type="text/javascript">
	$(document).ready(function() {
		//BOX BUTTON SHOW AND CLOSE
	   jQuery('.small-graph-box').hover(function() {
		  jQuery(this).find('.box-button').fadeIn('fast');
	   }, function() {
		  jQuery(this).find('.box-button').fadeOut('fast');
	   });
	   jQuery('.small-graph-box .box-close').click(function() {
		  jQuery(this).closest('.small-graph-box').fadeOut(200);
		  return false;
	   });
	   
	    //CHARTS
	    function gd(year, day, month) {
			return new Date(year, month - 1, day).getTime();
		}
		
		graphArea2 = Morris.Area({
			element: 'hero-area',
			padding: 10,
        behaveLikeLine: true,
        gridEnabled: false,
        gridLineColor: '#dddddd',
        axes: true,
        resize: true,
        smooth:true,
        pointSize: 0,
        lineWidth: 0,
        fillOpacity:0.85,
			data: [
				{period: '2010 Q1', iphone: 2666, ipad: null, itouch: 2647},
				{period: '2010 Q2', iphone: 15778, ipad: 13794, itouch: 12041},
				{period: '2010 Q3', iphone: 12912, ipad: 10969, itouch: 9901},
				{period: '2010 Q4', iphone: 8767, ipad: 6597, itouch: 6689},
				{period: '2011 Q1', iphone: 10810, ipad: 10914, itouch: 12293},
				{period: '2011 Q2', iphone: 9670, ipad: 9000, itouch: 7881},
				{period: '2011 Q3', iphone: 4820, ipad: 3795, itouch: 1588},
				{period: '2011 Q4', iphone: 15073, ipad: 8967, itouch: 5175},
				{period: '2012 Q1', iphone: 10687, ipad: 4460, itouch: 2028},
				{period: '2012 Q2', iphone: 8432, ipad: 5713, itouch: 1791}
			],
			lineColors:['#869d9d','#EFC94C','#45B29D'],
			xkey: 'period',
            redraw: true,
            ykeys: ['iphone', 'ipad', 'itouch'],
            labels: ['All Visitors', 'Returning Visitors', 'Unique Visitors'],
			pointSize: 2,
			hideHover: 'auto',
			resize: true
		});
		
			// graph real time
		if ($('#graph-flot-realtime').length) {
		
			var data = [],
				totalPoints = 300;

			function getRandomData() {

				if (data.length > 0)
					data = data.slice(1);

				// Do a random walk

				while (data.length < totalPoints) {

					var prev = data.length > 0 ? data[data.length - 1] : 50,
						y = prev + Math.random() * 10 - 5;

					if (y < 0) {
						y = 0;
					} else if (y > 100) {
						y = 100;
					}

					data.push(y);
				}

				// Zip the generated y values with the x values

				var res = [];
				for (var i = 0; i < data.length; ++i) {
					res.push([i, data[i]])
				}

				return res;
			}

			// Set up the control widget

			var updateInterval = 30;
			$().val(updateInterval).change(function () {
				var v = $(this).val();
				if (v && !isNaN(+v)) {
					updateInterval = +v;
					if (updateInterval < 1) {
						updateInterval = 1;
					} else if (updateInterval > 2000) {
						updateInterval = 2000;
					}
					$(this).val("" + updateInterval);
				}
			});

			var plot = $.plot("#graph-flot-realtime", [ getRandomData() ], {
				series: {
					lines: { 
						show: true,
						lineWidth: 1,
						fill: true, 
						fillColor: { colors: [ { opacity: 0.5 }, { opacity: 0.5 } ] }
					},
					shadowSize: 0	// Drawing is faster without shadows
				},
				colors: ["#1ABC9C"],
				
				yaxis: {
					min: 0,
					max: 110
				},
				xaxis: {
					show: false
				},
				grid:{borderWidth:1,backgroundColor:"#FFF"}
			});

			function update() {

				plot.setData([getRandomData()]);

				// Since the axes don't change, we don't need to call plot.setupGrid()

				plot.draw();
				setTimeout(update, updateInterval);
			}

			update();
		}
	    
		//WORLD MAP
		$('#world-map').vectorMap({
			map: 'world_merc_en',
			backgroundColor: '#ffffff',
			zoomOnScroll: false,
			regionStyle: {
				initial: {
					fill: '#e1e1e1',
					stroke: 'none',
					"stroke-width": 0,
					"stroke-opacity": 1
				},
				hover: {
					"fill-opacity": 0.8
				},
				selected: {
					fill: '#8dc859'
				},
				selectedHover: {
				}
			},
			markerStyle: {
				initial: {
					fill: '#FF6C60',
					stroke: '#FF6C60'
				}
			},
			markers: [
				{latLng: [38.35, -121.92], name: 'Los Angeles - 23'},
				{latLng: [39.36, -73.12], name: 'New York - 84'},
				{latLng: [50.49, -0.23], name: 'London - 43'},
				{latLng: [36.29, 138.54], name: 'Tokyo - 33'},
				{latLng: [37.02, 114.13], name: 'Beijing - 91'},
				{latLng: [-32.59, 150.21], name: 'Sydney - 22'},
			],
			series: {
				regions: [{
					values: gdpData,
					scale: ['#6fc4fe', '#58DDD0'],
					normalizeFunction: 'polynomial'
				}]
			},
			onRegionLabelShow: function(e, el, code){
				el.html(el.html()+' ('+gdpData[code]+')');
			}
		});

		/* SPARKLINE - graph in header */
		var orderValues = [10,8,5,7,4,4,3,8,0,7,10,6,5,4,3,6,8,9];

		$('.spark-orders').sparkline(orderValues, {
			type: 'bar', 
			barColor: '#7FC8BA',
			height: 25,
			barWidth: 6
		});

		var revenuesValues = [8,3,2,6,4,9,1,10,8,2,5,8,6,9,3,4,2,3,7];

		$('.spark-revenues').sparkline(revenuesValues, {
			type: 'bar', 
			barColor: '#7FC8BA',
			height: 25,
			barWidth: 6
		});

		/* ANIMATED WEATHER */
		var skycons = new Skycons({"color": "#58DDD0"});
		// on Android, a nasty hack is needed: {"resizeClear": true}

		// you can add a canvas by it's ID...
		skycons.add("current-weather", Skycons.SNOW);

		// start animation!
		skycons.play();

		$('.conversation-inner').slimScroll({
	        height: '405px',
	        wheelStep: 35,
	    });
		
		$('.chat-input').keypress(function (ev) {
			var p = ev.which;
			var chatTime = moment().format("MMMM Do YYYY, h:mm a");
			var chatText = $('.chat-input').val();
			if (p == 13) {
				if (chatText == "") {
					alert('Empty Field');
				} else {
					$('<div class="conversation-item item-left clearfix"><div class="conversation-user"><img src="img/samples/ryan.png" alt="male"/></div><div class="conversation-body"><div class="name">Ryan Gossling</div><div class="time hidden-xs">' + chatTime + '</div><div class="text">' + chatText + '</div></div></div>').appendTo('.conversation-inner');
					$(this).val('');
					$('.conversation-inner').scrollTo('100%', '100%', {
					easing: 'swing'
					});
				}
				return false;
				ev.epreventDefault();
				ev.stopPropagation();
			}
		});
		$('.chat-send .btn').click(function () {
			var chatTime = moment().format("MMMM Do YYYY, h:mm a");
			var chatText = $('.chat-input').val();
			if (chatText == "") {
				alert('Empty Field');
				$(".chat-input").focus();
			} else {
				$('<div class="conversation-item item-left clearfix"><div class="conversation-user"><img src="img/samples/ryan.png" alt="male"/></div><div class="conversation-body"><div class="name">Ryan Gossling</div><div class="time hidden-xs">' + chatTime + '</div><div class="text">' + chatText + '</div></div></div>').appendTo('.conversation-inner');
				$('.chat-input').val('');
				$(".chat-input").focus();
				$('.conversation-inner').scrollTo('100%', '100%', {
					easing: 'swing'
				});
			}
			return false;
		});
	});

           
        </script>

</body>
</html>