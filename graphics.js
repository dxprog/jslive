var
graphics = (function() {
	
	var
	
	DCs = [],
	graphicsObj = {},
	defaultBg = '',
	images = {},
	objs = [],
	screen = document.getElementById('screen'),
	screenCtx = screen.getContext('2d'),
	
	/* Private Methods */
	loadImage = function(file) {	
		if (typeof(images[file]) === 'undefined') {
			images[file] = {};
			$.ajax({
				url:'getImage.php?file=' + file,
				dataType:'json',
				async:false,
				success:function(data) {
					images[file] = data;
				}
			});
		}
	},
	
	/* Public Methods */
	methods = {
	
		init:function() {
			var obj;
			for (var i = 0; i < 16; i++) {
				obj = {};
				obj.element = document.createElement('canvas');
				obj.element.width = 640,
				obj.element.height = 480,
				obj.ctx = obj.element.getContext('2d');
				DCs.push(obj);
			}
		},
		
		fastBlit:function(src, x, y, height, width, dest, alpha) {
			dest.drawImage(src, x, y, height, width);
		},
		
		refresh:function() {
			screenCtx.drawImage(DCs[0].ctx, 0, 0, 640, 480, screenCtx);
		},
		
		newObj:function() {

		},
		
		getObj:function(type, layer) {

		},
		
		solid:function(layer, x, y, width, height, r, g, b) {
			
		},
		
		open:function(file, effect, opacity) {
			loadImage(file);
		},
		
		load:function(file, type, layer, sub, visible) {
			
		},
		
		move:function(type, layer, x, y) {

		},
		
		setPattern:function(type, layer, pattern) {

		},
		
		displayRect:function(type, layer, x, y, width, height) {

		},
		
		adjust:function(type, layer, index, x, y) {

		},
		
		del:function(layer) {

		},
		
		clear:function(type, layer) {

		},
		
		clearLayer:function(layer) {
			
		},
		
		moveLayer:function(type, src, dest) {

		},
		
		alpha:function(type, layer, alpha) {

		},
		
		show:function(type, layer, visibility) {

		}
		
	};
	
	return methods;
	
}());