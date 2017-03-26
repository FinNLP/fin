import lexed = require('lexed');
import tagger = require('en-pos');
import parser = require('en-parse');
import {ResultNode as DepNode} from "en-parse/dist/index";
import {NodeInterface as TreeInterface} from "en-parse/dist/index";

export class Run {

	public raw:string = "";
	public intercepted:string = "";
	public sentences:SentenceResult[] = [];
	constructor(input:string){
		this.raw = input;
		/**
		 * 1: Intercepting inputs
		**/
		this.intercepted = input;
		for (var index = 0; index < preProcessors.length; index++) {
			var interceptor = preProcessors[index];
			this.intercepted = interceptor(this.intercepted);
		}
		/**
		 * 2: Do the magic
		**/
		const _lexer = new lexed.Lexed(this.intercepted).lexer();
		for (var index = 0; index < _lexer.sentences.length; index++) {
			this.sentences[index] = {
				sentence:"",
				confidence:0,
				deps:[],
				tags:[],
				depsTree:<TreeInterface>{},
				tokens:[]
			};
			this.sentences[index].sentence = _lexer.sentences[index];
			this.sentences[index].tokens = _lexer.tokens[index];
			const taggingInstance = new tagger.Tag(this.sentences[index].tokens).initial().smooth();
			this.sentences[index].tags = taggingInstance.tags;
			this.sentences[index].confidence = (taggingInstance.confidence.reduce((a,b)=>a+b,0) / taggingInstance.confidence.length) - 10;
			this.sentences[index].depsTree = parser.tree(this.sentences[index].tags,this.sentences[index].tokens)[0];
			this.sentences[index].deps = parser.toArray(this.sentences[index].depsTree);
		}
		// post processing interceptors
		let result = {
			raw:this.raw,
			intercepted:this.intercepted,
			sentences:this.sentences
		};
		for (var index = 0; index < postProcessors.length; index++) {
			result = postProcessors[index](result);
		}
		this.raw = result.raw;
		this.intercepted = result.intercepted;
		this.sentences = result.sentences;

		return this;
	}
}

export interface SentenceResult {
	sentence:string;
	tokens:string[];
	tags:string[];
	deps:DepNode[];
	depsTree:TreeInterface;
	confidence:number;
};

/**
 * Extensions directory
**/
// interceptor functions array
export const preProcessors:Array<PreProcessor> = [];
export const postProcessors:Array<PostProcessor> = [];


export interface PreProcessor {
	(input:string):string;
}
export interface PostProcessor {
	(input:Run):Run;
}