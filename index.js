const lexed = require('lexed');
lexed.english();
const lexer = lexed.lexer;
const tagger = require('en-pos');
const parser = require('en-parse');

var interceptors = [];

var fin = function(input){
	// process interceptions
	interceptors.forEach(f=>input=f(input));
	// lex, tag then parse ..
	var lexResult = lexer(input);
	var tagResult = lexResult.map(sentence=>tagger(sentence.tokens,sentence.meta));
	var parseReulst = lexResult.map((sentence,i)=>parser(tagResult[i].tags,uncontract(sentence.tokens)));
	this.input = input;
	this.sentences = lexResult.map(sentence=>sentence.raw);
	this.result = lexResult.map((sentence,index)=>{
		return {
			raw:this.sentences[index],
			tokens:lexResult[index].tokens,
			tokenizationMeta:lexResult[index].meta,
			confidence:tagResult[index].confidence-10,
			tags:tagResult[index].tags,
			deps:parseReulst[index],
		};
	});
	return this;
};


fin.intercept = function(f){
	if(typeof f !== "function") console.warn("FIN: An interceptor must be a function");
	else interceptors.push(f);
};

fin.extend = function(detector){
	if(Array.isArray(detector)) detector.forEach((single)=>add(single));
	else add(detector);
	function add(detector){
		if(typeof detector === "object" && detector !== null && detector.id && detector.detector) fin.prototype[detector.id] = detector.detector;
		else console.warn("FIN: The detector you're trying to add is invalid.");
	}
};

// solve contractions
// a necessary step for the dependency parser
var contractions = ["'m",	"'s",	"'d",	"'ll",	"'re",	"'ve"];
var replacements = ["am",	"is",	"would","will",	"are",	"have"];
function uncontract (arr){
	return arr.map((x)=>{
		var ci = contractions.indexOf(x);
		if(~ci) return replacements[ci];
		else return x;
	});
}

module.exports = fin;