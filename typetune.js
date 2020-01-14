var fs = require('fs');
var scribble = require('scribbletune');
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(require('sanitize').middleware);

app.set('view engine', 'ejs')

app.get('/', function(req, res) {
	res.render('home.ejs');
})
.get('/notes', function(req, res) {
	let words = req.queryString('words');
	if (words.toLowerCase() == "paige myers") {
		res.render('custom.ejs');
//		break;
	}
	if (words.length > 1000) {
        words = words.substring(0, 1000);
    }
	let pattern = words.getPattern();
	word = words.split("");
	let vowels = ("aeiou").split("");
	let vowel_count = 0;
	let roots = ['a', 'b' ,'c', 'd', 'e', 'f', 'g'];

	let json_file = fs.readFileSync("public/modes.json");
	let content = JSON.parse(json_file);
	let value = 0;
	let octave = 1;
	for(var x = 0; x < words.length; x++) {
		value = value + words[x].charCodeAt(0);
		if(vowels.indexOf(words[x]) >= 0 ) {
			vowel_count += 1;
			octave += 1;
			if(octave > 5){ octave = 1;  }
		}
	}
	max_modes = content.modes.length;
	value = value * 5 / max_modes;
	while(value > max_modes) {
		value -= max_modes;
	}
	let note = (vowel_count * Math.ceil(value)) % 7;
	let mode = content.modes[Math.ceil(value-1)];
	let scale = [];
	while(scale.length == 0) {
		scale = scribble.scale(roots[note], mode);
		mode -= 1;
	}
	scale = scale.map(function(e) {return e + octave.toString()});
	scale = arrayShuffle(scale, value);
	console.log(roots[note], mode, octave);
	console.log(scale);
	console.log(pattern);
	//changed clip.js to always end in first note in the array
	//so the tune sounds complete
	let clip = scribble.clip({
		notes: scale,
		pattern: pattern
	});
	let file = 'public/songs/music.mid';
	scribble.midi(clip, file);
	fs.readFile(file, { encoding: 'base64'}, function(err, data){
		if (err) {
			throw err;
		}
		let output = 'data:audio/mid;base64,' + data;
		res.render('notes.ejs', {
			output: output
		});
	});
})
.get('/notes', function(req, res) {
        res.redirect('/');
});
app.listen(8080);


String.prototype.getPattern = function() {
	//get rid of some characters
  console.log("words:", this);
  var shrink = '';
  for (var i=0; i<this.length; i++) {
    if (i%4==0) shrink += this[i];
  }
  var pattern = "" , i, x, chr, prev_chr;
  var cut = shrink.split(" ");
  for (i = 0; i < cut.length; i++) {
    pattern += "x";
    for (x = 1; x < cut[i].length; x++) {
        chr = cut[i].charCodeAt(x);
        prev_chr = cut[i].charCodeAt(x - 1);
        if(prev_chr - 5 < chr && prev_chr + 5 > chr) {
            pattern += "x";
        } else {
            pattern += "_";
        }
    }
    //add note offs
    if(i - 1 != cut.length) pattern += "-";
  }
  return pattern;
};

function arrayShuffle(arr, seed) {
	var currentIndex = arr.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element..
    randomIndex = Math.floor(Math.abs(Math.sin(seed)) * currentIndex);
    seed /= 2;
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = arr[currentIndex];
    arr[currentIndex] = arr[randomIndex];
    arr[randomIndex] = temporaryValue;
  }

  return arr;
}
