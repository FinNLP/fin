import lexed = require('lexed');
import tagger = require('en-pos');
import parser = require('en-parse');
import {extend as extendLexicon} from "en-lexicon";
import {abbreviations} from "lexed";

import {ResultNode as DepNode} from "en-parse/dist/index";
import {NodeInterface as TreeInterface} from "en-parse/dist/index";
import {LexiconType as LexiconExtension} from "en-lexicon/dist/lexicon";

export class Run {

	public raw:string;
	public intercepted:string;
	public sentences:{
		sentence:string;
		tokens:string[];
		tags:string[];
		deps:DepNode[];
		depsTree:TreeInterface;
		confidence:number;
	}[];
	constructor(input:string){
		this.raw = input;

		/**
		 * 1: Intercepting inputs
		**/
		this.intercepted = input;
		for (var index = 0; index < interceptors.length; index++) {
			var interceptor = interceptors[index];
			this.intercepted = interceptor(this.intercepted);
		}

		/**
		 * 2: Do the magic
		**/
		const _lexer = new lexed.Lexed(this.intercepted).lexer();
		for (var index = 0; index < _lexer.sentences.length; index++) {
			this.sentences[index].sentence = _lexer.sentences[index];
			this.sentences[index].tokens = _lexer.tokens[index];
			const taggingInstance = new tagger.Tag(this.sentences[index].tokens).initial().smooth();
			this.sentences[index].tokens = taggingInstance.tokens;
			this.sentences[index].confidence = (taggingInstance.confidence.reduce((a,b)=>a+b,0) / taggingInstance.confidence.length) - 10;
			this.sentences[index].depsTree = parser.tree(this.sentences[index].tags,this.sentences[index].tokens)[0];
			this.sentences[index].deps = parser.toArray(this.sentences[index].depsTree);
		}
		return this;
	}
}

/**
 * Extensions directory
**/
// interceptor functions array
export const interceptors:Array<Interceptor> = [];
export function addInterceptor(interceptor:Interceptor|Interceptor[]){
	if(!Array.isArray(interceptor)) interceptor = [interceptor];
	interceptors.unshift.apply(interceptors,interceptor);
}
export function extend(extensions:Extensions){
	extensions.forEach((extension)=>{
		if(extension.type === "interceptor")
			addInterceptor(extension.extension);
		else if(extension.type === "lexicon")
			extendLexicon(extension.extension);
		else if(extension.type === "abbreviations") {
			abbreviations.push.apply(extension.extension);
		}
		else {
			console.warn("FIN WARNING: invalid extension");
			console.warn(extensions);
		}
	});
}


export interface Interceptor {
	(input:string):string;
}
export interface ExtensionInterceptor {
	type:"interceptor";
	extension:Interceptor;
}
export interface ExtensionAbbreviations {
	type:"abbreviations";
	extension:string[];
}
export interface ExtensionLexicon {
	type:"lexicon";
	extension:LexiconExtension;
}
export type Extensions = Array <
	ExtensionInterceptor|
	ExtensionAbbreviations|
	ExtensionLexicon
>;