var
graphics = (function() {
	
	var
	
	DCs = [],
	graphicsObj = {},
	defaultBg = '',
	images = {},
	objs = [],
	
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
		
		blit:function(src, x, y, height, width, alpha) {
			
		},
		
		refresh:function() {
			
		},
		
		newObj:function() {
			retVal = {adjust:[], x:0, y:0, visible:false};
			for (var i = 0; i < 8; i++) {
				retVal.adjust.push({x:0, y:0});
			}
			return retVal;
		},
		
		getObj:function(type, layer) {
			var obj = graphicsObj[type + layer];
			if (typeof(obj) === 'undefined' || obj === null) {
				graphicsObj[type + layer] = graphics.newObj();
			} else {
				graphicsObj[type + layer].container = $('#' + type + layer);
				graphicsObj[type + layer].img = graphicsObj[type + layer].container.find('img');
			}
			return graphicsObj[type + layer];
		},
		
		solid:function(layer, x, y, width, height, r, g, b) {
			
			var obj = graphics.getObj('bg', layer), $container;
			if (typeof(obj.container) == 'undefined' || obj.container.length == 1) {
				$('#bg' + layer).remove();
				$container = $('<div class="image" id="bg' + layer + '" style="z-index:' + layer + ';" layer="' + layer + '"></div>');
				$container.appendTo('#container');
				obj.container = $('#bg' + layer);
			} else {
				$container = obj.container;
				obj.container.find('img').remove();
			}
			layer = layer * 2;
			$container.css({left:x + 'px', top:y + 'px', width:width + 'px', height:height + 'px', background:'rgb(' + r + ', ' + g + ', ' + b + ')'});
			
		},
		
		load:function(file, type, layer, sub, visible) {
			var obj = graphics.getObj(type, layer), $container = null;
			// file = './KANON_SE/images/' + file + '.png';
			visible = visible || true;
			obj.file = file;
			obj.x = 0;
			obj.y = 0;
			sub = sub || layer;
			var zindex = layer * 2 + (type == 'bg' ? 0 : 1);
			// Inject the damn thing into the DOM now if it's not already there
			if (typeof(obj.container) === 'undefined' || obj.container.length == 0) {
				$container = $('<div class="image" id="' + type + sub + '" style="z-index:' + zindex + ';" layer="' + layer + '"></div>');
				$container.appendTo('#container');
				obj.container = $('#' + type + sub);
			}
			
			$.ajax({
				url:'getImage.php?file=' + file,
				dataType:'json',
				success:
					function(data) {
						if (typeof(obj.img) !== 'undefined' && obj.img.length > 0) {
							obj.img.attr('src', data.img);
						} else {
							obj.img = $('<img src="' + data.img + '" />');
							obj.img.appendTo(obj.container);
						}
						if (data.regions) {
							images[layer] = data.regions;
						}
						if (!visible) {
							obj.img.hide();
						}
					}
			});
		},
		
		move:function(type, layer, x, y) {
			var obj = graphics.getObj(type, layer);
			obj.x = x;
			obj.y = y;
			for (var i in obj.adjust) {
				x += obj.adjust[i].x;
				y += obj.adjust[i].y;
			}
			if (typeof(obj.container) !== 'undefined') {
				obj.container.css({left:x + 'px', top:y + 'px'});
			}
		},
		
		setPattern:function(type, layer, pattern) {
			if (typeof(images[layer]) !== 'undefined' && null !== images[layer] && typeof(images[layer][pattern]) !== 'undefined') {
				var
				patt = images[layer][pattern],
				width = Math.abs(patt.x1 - patt.x2),
				height = Math.abs(patt.y1 - patt.y2);
				graphics.displayRect(type, layer, patt.x1, patt.y1, width, height);
			}
		},
		
		displayRect:function(type, layer, x, y, width, height) {
			obj = graphics.getObj(type, layer);
			obj.container.css({width:width, height:height});
			obj.img.css({left:'-' + x + 'px', top:'-' + y + 'px'});
		},
		
		adjust:function(type, layer, index, x, y) {
			var obj = graphics.getObj(type, layer);
			obj.adjust[index].x = x;
			obj.adjust[index].y = y;
			x = obj.x; y = obj.y;
			for (var i in obj.adjust) {
				x += obj.adjust[i].x;
				y += obj.adjust[i].y;
			}
			obj.container.css({left:x + 'px', top:y + 'px'});
		},
		
		del:function(layer) {
			graphicsObj['bg' + layer] = graphics.newObj();
			graphicsObj['obj' + layer] = graphics.newObj();
			$('#bg' + layer).remove();
			$('#obj' + layer).remove();
		},
		
		clear:function(type, layer) {
			graphicsObj[type + layer] = graphics.newObj();
			images[layer] = null;
			$('#' + type + layer).remove();
		},
		
		clearLayer:function(layer) {
			$('[layer="' + layer + '"]').remove();
		},
		
		moveLayer:function(type, src, dest) {
			$('#' + type + dest + ' img').attr('src', $('#' + type + src + ' img').attr('src'));
			graphics.del(type);
		},
		
		alpha:function(type, layer, alpha) {
			$('#' + type + layer).css('opacity', (alpha / 255));
		},
		
		show:function(type, layer, visibility) {
			var obj = graphics.getObj(type, layer);
			obj.visible = visibility > 0;
			if (typeof(obj.container) !== 'undefined' && obj.container.length > 0) {
				if (obj.visible) {
					obj.container.show();
				} else {
					obj.container.hide();
				}
			}
		}
		
	};
	
	return methods;
	
}());