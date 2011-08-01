(function($) {

	var
	
	stack = [],
	variables = {},
	code = {},
	labels = {},
	currentOp = 0,
	title = '',	
	timers = [],
	exit = false,
	music = document.createElement('audio'),
	sfx = document.createElement('audio'),
	opCount = 0,
	multiId = null,
	playerName = 'Yuuichi',
	currentScene = 70,
	breakForGraphics = false,
	graphicsTimer = null,
	trace = [],
	audio = typeof(document.createElement('audio').play) === 'function',
	
	isNumeric = function (input)
	{
	   return (input - 0) == input && input.length > 0;
	},
	
	isOperator = function(input) {
		for (var i = 0, count = input.length; i < count; i++) {
			var c = input.charAt(i);
			if (c != '=' && c != '<' && c != '!' && c != '>' && c != '-' && c != '|' && c != '/' && c != '*' && c != '&') {
				return false;
			}
		}
		return true;
	},
	
	isString = function(input) {
		if (input.charAt(0) == '\'') {
			return true;
		}
		return false;
	},
	
	isVar = function(name) {
		var retVal = false;
		if (typeof(variables[name]) !== 'undefined') {
			retVal = true;
		}
		return retVal;
	},
	
	getCharacterType = function(c) {
	
		var retVal = 'char';
	
		switch (c) {
			case '=':
			case '+':
			case '*':
			case '-':
			case '/':
			case '|':
			case '&':
			case '!':
			case '<':
			case '>':
				retVal = 'operator';
				break;
			case '\'':
			case '"':
				retVal = 'string';
				break;
			case ' ':
			case '\t':
				retVal = 'whitespace';
				break;
			case '\r':
			case '\n':
				retVal = 'newline';
				break;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
			case '0':
				retVal = 'number';
				break;
			case '(':
				retVal = 'beginfunc';
				break;
			case ')':
				retVal = 'endfunc';
				break;
			case ',':
				retVal = 'separator';
				break;
			case '@':
				retVal = 'label';
				break;
			case '{':
				retVal = 'beginarray';
				break;
			case '}':
				retVal = 'endarray';
				break;
		}
	
		return retVal;
	
	},
	
	evaluateExpression = function(expression) {
	
		var out = '', params = [];
		
		for (var i = 0, count = expression.length; i < count; i++) {
			
			var c = expression.charAt(i);
			switch (getCharacterType(c)) {
				case 'operator':
				case 'number':
				case 'whitespace':
				case 'newline':
				case 'beginarray':
				case 'endarray':
				case 'separator':
					out += c;
					break;
				
				case 'string':
					var start = c, getNext = true, escape = false;
					out += c;
					while (getNext) {
						i++;
						if (i < expression.length) {
							c = expression.charAt(i);
							if (c == '\\') {
								escape = true;
							} else if (c == start && !escape) {
								getNext = false;
							}
							out += c;
						} else {
							getNext = false;
						}
					}
					break;
				
				// All of the above are accounted for, that leaves variables and functions
				default:
					// Get the rest of the characters
					var name = '', openfuncs = 0, type = getCharacterType(c), func = false, paramName = '', isJumpCoord = false, openarrays = 0;
					i++;
					while ((type == 'char' || type == 'whitespace' || type == 'beginfunc' || type == 'endfunc' || type == 'number' || type == 'label' || type == 'beginarray' || type == 'endarray' || type == 'separator' || openfuncs > 0) && i < expression.length) {
						
						if (type != 'whitespace' && type != 'separator' && type != 'beginfunc' && type != 'endfunc' && type != 'label' && type != 'beginarray' && type != 'endarray') {
							if (openfuncs == 0 && !isJumpCoord) {
								name += c;
							} else {
								paramName += c;
							}
						}
						
						if (type == 'beginarray') {
							openarrays++;
						}
						
						if (type == 'endarray') {
							openarrays--;
						}
						
						if (type == 'beginfunc') {
							func = true;
							if (openfuncs > 0) {
								paramName += c;
							}
							openfuncs++;
						}
						
						if (type == 'endfunc') {
							openfuncs--;
							if (openfuncs > 0) {
								paramName += c;
							}
							params.push(paramName);
							paramName = '';
						}
						
						if (type == 'label') {
							isJumpCoord = true;
						}
						
						if (type == 'whitespace' && isJumpCoord) {
							params.push(paramName);
							paramName = '';
							isJumpCoord = false;
						}
						
						if (type == 'separator' && openfuncs > 0 && openarrays == 0) {
							if (openfuncs == 1) {
								params.push(paramName);
								paramName = '';
							} else {
								paramName += c;
							}
						}
						
						if (type == 'separator' && openarrays > 0) {
							paramName += ',';
						}
						
						c = expression.charAt(i++);
						type = getCharacterType(c);
					}
					
					if (i < expression.length) {
						i -= 2;
					} else {
						if (type == 'char') {
							name += c;
						}
					}
					
					if (isJumpCoord) {
						paramName += c;
						params.push(paramName);
					}
					
					if (!func) {
						if (typeof(methods[name]) == 'function') {
							out = 'methods.' + name + '(' + (params.length > 0 ? 'params' : '') + ')';
						} else {
							out += 'variables["' + name + '"]';
						}
					} else {
						params.push(paramName);
						out += 'methods.' + name + '(params)';
					}
					
					// Skip over unknown opcodes
					if (name == 'op') {
						return false;
					}
					
					break;
				
			}
			
		}
		
		var retVal;
		//try {
			retVal = eval(out);
		/*} catch (e) {
			throw ('Unknown op or incorrectly parsed line: ' + out);
			console.log(params);
			exit = true;
		} */
		
		return retVal;
	},
	
	// A hacky attempt at implementing rlBabel stuff
	rlBabel = function(args) {
	
		switch (args[1]) {
		
			case '10': // Textout
				
				// Calculate the address of the string
				var
				addr = parseInt(args[2]) & 0xfff,
				string = variables['strS[' + addr + ']'],
				
				// Check for name and such
				name = string.match(/(.*?)/g),
				msg = string.split(''),
				out = string;
				
				if (null != name) {
					name = name[0];
					msg = msg[1];
					
					if (!msg) {
						msg = string.replace('__', '');
					}

					if (name.match(/__/g)) {
						name = playerName;
					}
					msg = msg.replace(/__/g, playerName);
					out = '<span class="speaker">' + name + '</span><span class="dialog">' + msg + '</span>';
				}
				
				$('#dialog').html(out).fadeIn();
				
				if (null != name) {
					var width = $('.speaker').outerWidth();
					$('.dialog').width((560 - width) + 'px');
				}
				
				break;
		
		}
	
	},
	
	methods = {
		
		// Variable assigning
		assign:function(name, value, operation) {
			evaluateExpression(name + ' ' + operation + ' ' + value);
		},
		
		// Changes the title
		title:function(params, extra) {
			title = params[0];
		},
		
		/********************* BRANCHING OPERATIONS *********************/
		select:function(params) {
			$('#dialog').html('<a href="javascript:void(0);" class="select" rel="0">' + variables["strS[1903]"] + '</a><br /><a href="javascript:void(0);" class="select" rel="1">' + variables["strS[1904]"] + '</a>');
			$('.select').unbind('click').click(methods.selectClick);
			exit = true;
		},
		
		selectClick:function(e) {
			var
			rel = parseInt($(e.target).attr('rel')),
			op = code[currentScene][currentOp - 1],
			newCode = op.code.split('=')[0] + ' = ' + rel;
			evaluateExpression(newCode);
			loop();
		},
		
		/********************** AUDIO OPERATIONS ***********************/
		bgmLoop:function(params) {
			if (audio) {
				var file = evaluateExpression(params[0]);
				music.src = './KANON_SE/music/' + file + '.mp3';
				music.loop = true;
				music.load();
				music.play();
			}
		},
		
		bgmPlay:function(params) {
			if (audio) {
				var file = evaluateExpression(params[0]);
				music.src = './KANON_SE/music/' + file + '.mp3';
				music.loop = false;
				music.load();
				music.play();
			}
		},
		
		bgmFadeOutEx:function(params) {
			
		},
		
		bgmFadeOut:function(params) {
		
		},
		
		wavStop:function() {
			if (audio) {
				sfx.pause();
			}
		},
		
		wavPlay:function(params) {
			if (audio) {
				var file = evaluateExpression(params[0]);
				sfx.src = './KANON_SE/sfx/' + file + '.wav';
				sfx.load();
				sfx.play();
			}
		},
		
		koePlay:function(params) {
		
		},
		
		/********************* GRAPHICS OPERATIONS *********************/
		grpOpenBg:function(params) {
			var file = evaluateExpression(params[0]).toUpperCase();
			if (file === '?' || file === '???') {
				
			} else {
				graphics.load(file, 'bg', 0);
			}
			breakForGraphics = true;
		},
		
		recOpenBg:function(params) {
			methods.grpOpenBg(params);
			breakForGraphics = true;
		},
		
		recOpen:function(params) {
			var file = evaluateExpression(params[0]).toUpperCase();
			if (file === '?' || file === '???') {
			} else {
				graphics.load(file, 'obj', 0);
			}
			breakForGraphics = true;
		},
		
		grpMulti:function(params) {
			params[0] = evaluateExpression(params[0]);
			if (typeof(params[0]) === 'string') {
				var file = params[0].toUpperCase();
				graphics.load(file, 'bg', 0);
				multiId = 0;
			} else if (typeof(params[0]) === 'number') {
				graphics.moveLayer('bg', params[0], 0);
				multiId = params[0];
				graphics.clearLayer(multiId);
			}
			for (var i = 1, count = params.length; i < count; i++) {
				params[i] = evaluateExpression(params[i]);
			}
			breakForGraphics = true;
		},
		
		recLoad:function(params) {
			breakForGraphics = true;
		},
		
		objBgOfFile:function(params) {
			var
			file = evaluateExpression(params[1]).toUpperCase(),
			name = evaluateExpression(params[0]),
			visible = typeof(params[2]) === 'undefined' ? false : params[2];
			graphics.load(file, 'bg', name);
			breakForGraphics = true;
		},
		
		objBgClear:function(params) {
			breakForGraphics = true;
		},
		
		objBgMove:function(params) {
			var name = evaluateExpression(params[0]), x = evaluateExpression(params[1]), y = evaluateExpression(params[2]);
			graphics.move('bg', name, x, y);
			breakForGraphics = true;
		},
		
		objMove:function(params) {
			var name = evaluateExpression(params[0]), x = evaluateExpression(params[1]), y = evaluateExpression(params[2]);
			graphics.move('obj', name, x, y);
		},
		
		grpBuffer:function(params) {
			var
			file = evaluateExpression(params[0]).toUpperCase(),
			layer = evaluateExpression(params[1]);
			graphics.load(file, 'bg', layer);
			breakForGraphics = true;
		},
		
		copy:function(params) {
			var file = evaluateExpression(params[0]).toUpperCase();
			graphics.load(file, 'bg', multiId, (new Date()).getTime());
			breakForGraphics = true;
		},
		
		objClear:function(params) {
			graphics.clear('obj', evaluateExpression(params[0]));
			breakForGraphics = true;
		},
		
		objOfFile:function(params) {
			graphics.load(evaluateExpression(params[1]), 'obj', evaluateExpression(params[0]));
			breakForGraphics = true;
		},
		
		objDriftOfFile:function(params) {
		
		},
		
		objBgDriftOfFile:function(params) {
		
		},
		
		objDriftOpts:function(params) {
		
		},
		
		objBgDriftOpts:function(params) {
		
		},
		
		objDispRect:function(params) {
			var
			buf = evaluateExpression(params[0]),
			x =  evaluateExpression(params[1]),
			y = evaluateExpression(params[2]),
			width = evaluateExpression(params[3]),
			height = evaluateExpression(params[4]);
			console.log(buf, x, y, width, height);
			// graphics.displayRect('obj', buf, x, y, width, height);
		},
		
		objBgDispRect:function(params) {
			var
			buf = evaluateExpression(params[0]),
			x =  evaluateExpression(params[1]),
			y = evaluateExpression(params[2]),
			width = evaluateExpression(params[3]),
			height = evaluateExpression(params[4]);
			console.log(buf, x, y, width, height);
			graphics.displayRect('bg', buf, x, y, width, height);
		},
		
		objCopyFgToBg:function(params) {
		
		},
		
		objShow:function(params) {
			graphics.show('obj', evaluateExpression(params[0]), evaluateExpression(params[1]));
			breakForGraphics = true;
		},
		
		objAlpha:function(params) {
			for (var i in params) {
				params[i] = evaluateExpression(params[i]);
			}
			graphics.alpha('obj', params[0], params[1]);
		},
		
		objPattNo:function(params) {
			graphics.setPattern('obj', evaluateExpression(params[0]), evaluateExpression(params[1]));
		},
		
		objGetPos:function(params) {
		
		},
		
		objGetDims:function(params) {
		
		},
		
		objBgPattNo:function(params) {
			graphics.setPattern('bg', evaluateExpression(params[0]), evaluateExpression(params[1]));
		},
		
		objBgShow:function(params) {
		
		},
		
		refresh:function() {
			breakForGraphics = true;
		},
		
		objAdjust:function(params) {
			// console.log(params);
			graphics.adjust('obj', evaluateExpression(params[0]), evaluateExpression(params[1]), evaluateExpression(params[2]), evaluateExpression(params[3]));
		},
		
		objDelete:function(params) {
			graphics.del(evaluateExpression(params[0]));
			breakForGraphics = true;
		},
		
		index_series:function(params) {
			var 
			retVal = 0,
			index = evaluateExpression(params[0]),
			offset = evaluateExpression(params[1]),
			init = evaluateExpression(params[2]),
			current = index + offset;
			
			for (var i = 3, max = params.length; i < max; i++) {
			
				var
				set = params[i].split(','),
				start = evaluateExpression(set[0]),
				end = evaluateExpression(set[1]),
				endVal = evaluateExpression(set[2]);
				
				if (current < start) {
					// retVal = start;
				} else if (current > end) {
					//retVal = endVal;
					init = endVal;
				} else {
					var 
					deltaOut = endVal - init,
					deltaIn = end - start,
					deltaCurrent = current - start;
					retVal = deltaCurrent / deltaIn * deltaOut + init;
					
					if (params.length > 4) {
						console.log(deltaOut, deltaIn, deltaCurrent, retVal, init);
					}
					
					break;
				}
			
			}
			
			return retVal;
		},
		
		recFill:function(params) {
			var
			x = evaluateExpression(params[0]),
			y = evaluateExpression(params[1]),
			w = evaluateExpression(params[2]),
			h = evaluateExpression(params[3]),
			dc = evaluateExpression(params[4]),
			r = evaluateExpression(params[5]),
			g = evaluateExpression(params[6]),
			b = evaluateExpression(params[7]);
			graphics.solid(dc, x, y, w, h, r, g, b);
		},
		
		InitFrames:function(params) {
			for (var i in params) {
				params[i] = params[i].split(',');
				for (var j in params[i]) {
					params[i][j] = evaluateExpression(params[i][j]);
				}
				var
				timer = params[i][0],
				opts = {startVal:params[i][1], endVal:params[i][2], duration:params[i][3], startTime:(new Date()).getTime()};
				frames[timer] = opts;
			}
		},
		
		InitExFrames:function(params) {
			methods.InitFrames(params);
		},
		
		ReadFrames:function(params) {
			var active = false;
			for (var i in params) {
				params[i] = params[i].split(',');
				var
				timer = evaluateExpression(params[i][0]),
				delta = ((new Date()).getTime() - frames[timer].startTime) / frames[timer].duration;
				delta > 1 ? 1 : delta;
				active = delta < 1 ? true : active;
				var val = (frames[timer].endVal - frames[timer].startVal) * delta + frames[timer].startVal;
				variables[params[i][1]] = Math.floor(val);
			}
			return active;
		},
		
		ReadExFrames:function(params) {
			methods.ReadFrames(params);
		},
		
		SetSkipAnimations:function(params) {
		
		},
		
		msgHide:function() {
			$('#dialog').fadeOut();
			breakForGraphics = true;
		},
		
		CallDLL:function(params) {
			if (params[0] == 0) {
				rlBabel(params);
			}
		},
		
		/********************** GRAPHICS EFFECTS ***********************/
		shake:function(params) {
		
		},
		
		ganPlayEx:function(params) {
		
		},
		
		/********************** TIMER OPERATIONS ***********************/
		ResetTimer:function(params) {
			var timer = 0;
			if (typeof(params[0]) !== 'undefined') {
				timer = evaluateExpression(params[0]);
			}
			timers[timer] = (new Date()).getTime();
			breakForGraphics = true;
		},
		
		Timer:function(params) {
			var timer = 0;
			if (typeof(params[0]) !== 'undefined') {
				timer = evaluateExpression(params[0]);
			}
			return (new Date()).getTime() - timers[timer];
			breakForGraphics = true;
		},
		
		/*********************** JUMP OPERATIONS ***********************/
		gosub:function(params) {
			stack.push({scene:currentScene, op:currentOp});
			// console.log(stack);
			methods.goto(params);
		},
		
		ret:function() {
			var op = stack.pop();
			currentScene = op.scene;
			currentOp = op.op;
		},
		
		rtl:function() {
			methods.ret();
		},
		
		goto:function(params) {
			currentOp = labels[currentScene]['@' + params[0]];
		},
		
		goto_on:function(params) {
		
		},
		
		goto_unless:function(params) {
			var
			e = evaluateExpression(params[0]),
			c = [evaluateExpression(params[1])];
			if (!e) {
				methods.goto(c);
			}
		},
		
		farcall:function(params) {
			stack.push({scene:currentScene, op:currentOp});
			methods.jump([params[0]]);
		},
		
		jump:function(params) {
			currentOp = -1;
			loadScenario(params[0]);
			exit = true;
		},
		
		waitC:function(params) {
			methods.wait(params);
		},
		
		
		wait:function(params) {
			var duration = evaluateExpression(params[0]);
			exit = true;
			setTimeout(loop, duration);
		},
		
		/************************ GENERIC CRAP ************************/
		itoa:function(params) {
			var len = evaluateExpression(params[1]), val = evaluateExpression(params[0]);
			while (('' + val).length < len) {
				val = '0' + val;
			}
			return val;
		},
		
		GetCursorPos:function() {
		
		},
		
		DisableAutoSavepoints:function() {
		
		},
		
		EnableAutoSavepoints:function() {
		
		},
		
		SetAutoMode:function(params) {
		
		},
		
		HideSyscom:function(params) {
		
		},
		
		SetMessageSpeed:function(params) {
		
		},
		
		setrng_stepped:function(params) {
		
		},
		
		pause:function() {
			exit = true;
			$('#container').click(function() { loop(); });
		},
		
		spause:function() {
			exit = true;
			$('#container').click(function() { loop(); });
		}
		
		
		
	},
	
	ajaxCallback = function(data) {
		
		currentScene = data.scene;
		code[currentScene] = data.code;
		labels[currentScene] = {};
		
		// Make a note of where all the labels are
		for (var i = 0, count = code[currentScene].length; i < count; i++) {
			if (typeof(code[currentScene][i].label) !== 'undefined') {
				labels[currentScene]['@' + code[currentScene][i].label] = i;
			}
		}
		loop();
		
	},
	
	executeOp = function(op) {
		// console.log('[' + currentScene + ', ' + op.ln + '] ' + op.code);
		evaluateExpression(op.code);
	},
	
	loop = function() {
	
		var op;
		
		$('#container').unbind('click');
		exit = false;
		
		while (!exit) {
		
			executeOp(code[currentScene][currentOp]);
			
			currentOp++;
			opCount++;
			if (currentOp >= code.length) {
				exit = true;
			}
			
			if (breakForGraphics) {
				graphicsTimer = setTimeout(loop, 17);
				exit = true;
				breakForGraphics = false;
			}
			
		}
		
	},

	loadScenario = function(scene) {
		$.ajax({
			url:'interpret.php?id=' + scene,
			dataType:'json',
			success:ajaxCallback
		});
	},
	
	stop = function() {
		exit = true;
		if (exit) {
			clearTimeout(graphicsTimer);
		} else {
			loop();
		}
	},
	
	init = function() {
		// Initialize all the timers to the current time
		var msTime = (new Date()).getTime();
		graphics.init();
		for (var i = 0; i < 256; i++) {
			timers.push(msTime);
		}
		$('#stop').click(stop);
		loadScenario(50);
	};
	
	$(init);

}(jQuery));