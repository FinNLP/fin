const lexed = require('lexed');
lexed.english();
const lexer = lexed.lexer;
const tagger = require('en-pos');
const parser = require('en-parse');

var langr = function(input){
	var lexResult = lexer(input);
	var tagResult = lexResult.map(sentence=>tagger(sentence.tokens,sentence.meta));
	var parseReulst = lexResult.map((sentence,i)=>parser(tagResult[i].tags,uncontract(sentence.tokens)));
	this.input = input;
	this.sentences = lexResult.map(sentence=>sentence.raw);
	this.output = lexResult.map((sentence,index)=>{
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

langr.extend = function(detector){
	if(Array.isArray(detector)) detector.forEach((single)=>add(single));
	else add(detector);
	function add(detector){
		if(typeof detector === "object" && detector !== null && detector.id && detector.detector) langr.prototype[detector.id] = detector.detector;
		else console.warn("LANGR: The detector you're trying to add is invalid.");
	}
};

module.exports = langr;// solve contractions
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