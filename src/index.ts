import lexed = require('lexed');
import tagger = require('en-pos');
import parser = require('en-parse');
import {extend as extendLexicon} from "en-lexicon";
import {abbreviations} from "lexed";

import {ResultNode as DepNode} from "en-parse/dist/index";
import {NodeInterface as TreeInterface} from "en-parse/dist/index";
import {LexiconType as LexiconExtension} from "en-lexicon/dist/lexicon";

export namespace Fin {

	/**
	 * ------------------------------------
	 * Main function
	 * ------------------------------------
	**/
	export function run (input:string):FinReturn{

		let result:FinReturn = {
			raw:"",
			intercepted:"",
			tokens:[[]],
			tags:[[]],
			deps:[[]],
			depsTree:[],
			confidence:[],
			sentences:[]
		};
		result.raw = input;

		/**
		 * ----------------
		 * 1: Intercepting inputs
		 * ----------------
		**/
		result.intercepted = input;
		interceptors.forEach((interceptor)=>{
			result.intercepted = interceptor(result.intercepted);
		});

		/**
		 * ----------------
		 * 2: Tokenization (Lexer)
		 * ----------------
		**/
		const _lexer = new lexed.Lexed(result.intercepted).lexer();
		result.sentences = _lexer.sentences;
		result.tokens = _lexer.tokens;

		/**
		 * ----------------
		 * 3: POS tagging
		 * ----------------
		**/
		for (var index = 0; index < result.tokens.length; index++) {
			const tokens = result.tokens[index];
			const taggingInstance = new tagger.Tag(tokens);
			taggingInstance.initial();
			taggingInstance.smooth();
			result.tags[index] = taggingInstance.tags;
			result.confidence[index] = taggingInstance.confidence.reduce((a,b)=>a+b,0) / taggingInstance.confidence.length;
			// but we can never be so sure about the dependency parsing :'(
			result.confidence[index] = result.confidence[index] - 10;
		}

		/**
		 * ----------------
		 * C: Dependency Parsing
		 * ----------------
		**/
		for (var index = 0; index < result.tokens.length; index++) {
			const tokens = result.tokens[index];
			const tags = result.tags[index];
			result.depsTree[index] = parser.tree(tags,tokens)[0];
			result.deps[index] = parser.toArray(result.depsTree[index]);
		}

		/**
		 * ----------------
		 * D: Apply Detectors
		 * ----------------
		**/
		detectors.forEach((detector)=>{
			result = detector(result);
		});
		
		return result;
	}

	/**
	 * ------------------------------------
	 * Extensions directory
	 * ------------------------------------
	**/
	// interceptor functions array
	export const interceptors:Array<Interceptor> = [];
	export const detectors:Array<Detector> = [];
	export function addDetector(detector:Detector|Detector[]){
		if(!Array.isArray(detector)) detector = [detector];
		detectors.unshift.apply(detectors,detector);
	}
	export function addInterceptor(interceptor:Interceptor|Interceptor[]){
		if(!Array.isArray(interceptor)) interceptor = [interceptor];
		interceptors.unshift.apply(interceptors,interceptor);
	}
	export function extend(extensions:Extensions){
		extensions.forEach((extension)=>{
			if(extension.type === "detector")
				addDetector(extension.extension);
			else if(extension.type === "interceptor")
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

	/**
	 * ------------------------------------
	 * Interfaces
	 * ------------------------------------
	**/
	export interface Interceptor {
		(input:string):string;
	}
	export interface Detector {
		(input:FinReturn):FinReturn;
	}
	export interface ExtensionDetector {
		type:"detector";
		extension:Detector;
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
		ExtensionDetector|
		ExtensionInterceptor|
		ExtensionAbbreviations|
		ExtensionLexicon
	>;

	export interface FinReturn {
		// input strings
		// raw
		raw:string;
		// intercepted
		intercepted:string;
		// public (results)
		tokens:string[][];
		sentences:string[];
		tags:string[][];
		confidence:number[];
		deps:DepNode[][];
		depsTree:TreeInterface[];
	}
}

export default Fin;