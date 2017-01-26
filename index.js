const lexed = require('lexed');
lexed.english();
const tagger = require('en-pos');
const parser = require('en-parse');
const lexicon = require('en-lexicon');
const interceptors = [];
const fin = function(input){
	// process interceptions
	interceptors.forEach(f=>input=f(input));
	// lex, tag then parse ..
	const lexResult = lexed.lexer(input);
	const tagResult = lexResult.map(sentence=>tagger(sentence.tokens,sentence.meta));
	const parseReulst = lexResult.map((sentence,i)=>parser(tagResult[i].tags,uncontract(sentence.tokens)));
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

fin.extend = function(extension){
	if(Array.isArray(extension)) extension.forEach((single)=>add(single));
	else add(extension);
	function add(extension){
		if(typeof extension === "object" && extension !== null && extension.id && extension.extension) {
			if(extension.id === "lexer-transformer") lexed.extend.transformer(extension.extension);
			else if(extension.id === "lexer-abbreviations") lexed.extend.abbreviations(extension.extension);
			else if(extension.id === "lexicon") lexicon.extend(extension.extension);
			else if(extension.id === "interceptor") interceptors.push(extension.extension);
			else fin.prototype[extension.id] = extension.extension;
		}
		else console.warn("FIN: The extension you're trying to add is invalid.");
	}
};

// solve contractions
// a necessary step for the dependency parser
const contractions = ["'m",	"'s",	"'d",	"'ll",	"'re",	"'ve"];
const replacements = ["am",	"is",	"would","will",	"are",	"have"];
function uncontract (arr){
	return arr.map((x)=>{
		var ci = contractions.indexOf(x);
		if(~ci) return replacements[ci];
		else return x;
	});
}

module.exports = fin;