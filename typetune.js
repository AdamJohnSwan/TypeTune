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
	if(!words) {
		// query string must be present for this to work. 
		res.redirect('/');
		return;
	}
	if (words.length > 1000) {
		words = words.substring(0, 1000);
	}
	
	const characters = words.split("");
	const vowels = ("aeiou").split("");
	const notes = ['a', 'b' ,'c', 'd', 'e', 'f', 'g'];
	
	// A list of modes that scribbletune can handle
	const json_file = fs.readFileSync("public/modes.json");
	const content = JSON.parse(json_file);
	
	// random_value is used to randomly select the mode, root note, and shuffle the notes around. 
	let random_value = 0;
	let octave = 0;
	characters.forEach(character => {
		// Increase random_value using each of the characters' char code
		random_value += character.charCodeAt(0);
		if(vowels.find(v => v === character.toLowerCase())) {
			// Get the octave by increasing the octave every time a vowel is found in the word. 
			// Set the octave back to one if the octave is greater than the number of vowels 
			octave = (octave % vowels.length) + 1;
		}
	});

	const max_modes = content.modes.length;
	const note = notes[random_value % notes.length];
	const mode = content.modes[random_value % max_modes];
	const scale = scribble.scale(`${note}${octave} ${mode}`);
	
	// Shuffle the notes around based on the random_value to create a song
	const song = arrayShuffle(scale, random_value);
	
	// Convert the words into a pattern that can be used by scribbletune 
	// x is a note on event, underscore sustains the note, and a hyphen is a note off event
	const pattern = getPattern(words);
	
	console.log(note, mode, octave);
	console.log(song);
	console.log(pattern);
	
	let clip = scribble.clip({
		notes: song,
		pattern: pattern
	});
	// Add the first note of the clip to the end so it sounds like a complete song
	if(clip.length > 1 ) {
		clip.push(clip[0]);
	}
	const bytes = scribble.midi(clip, null)
	const data = Buffer.from(bytes, 'binary').toString('base64')
	const output = 'data:audio/mid;base64,' + data;
	res.render('notes.ejs', {
		output: output
	});
});
app.listen(8080);


function getPattern(str){
	
	//keep only every fourth character so the song is not super long
	let shrink = "";
	if(str.length > 10) {
		for(let i = 0; i < str.length; i++) {
			if (i % 4 === 0 ) {
				shrink += str[i];
			}
		}
	} else {
		shrink = str;
	}
	let words = shrink.split(" ");
	let pattern = "";
	for (let wordsIndex = 0; wordsIndex < words.length; wordsIndex++) {
		let charCode = 0;
		let prevCharCode = 0;
		for (let letterIndex = 0; letterIndex < words[wordsIndex].length; letterIndex++) {
			let charCode = words[wordsIndex].charCodeAt(letterIndex);
			//Add a new note-on event (x) whenever the degree of difference between the letters is great enough. If not then add a sustain(_).
			if(charCode + 10 < prevCharCode || charCode - 10 > prevCharCode) {
				pattern += "x";
			} else {
				pattern += "_";
			}
			prevCharCode = charCode;
		}
		//add note offs after each word except on the last iteration
		if(wordsIndex != words.length - 1) {
			pattern += "-";
		}
	}
	return pattern;
};

function arrayShuffle(arr, seed) {
	
	let temporaryValue = 0;
	let randomIndex = 0;
	for(let currentIndex = arr.length - 1; currentIndex >= 0; currentIndex--) {
		// Pick a random index in the array
		randomIndex = Math.floor(Math.abs(Math.sin(seed)) * currentIndex);
		seed /= 2;

		// And swap its value with the current element's value.
		temporaryValue = arr[currentIndex];
		arr[currentIndex] = arr[randomIndex];
		arr[randomIndex] = temporaryValue;	
	}

	return arr;
}
