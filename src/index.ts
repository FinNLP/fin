import lexed = require('lexed');
import tagger = require('en-pos');
import parser = require('en-parse');

import {ResultNode as DepNode} from "en-parse/dist/index";

// initialize english built-in extension
lexed.extend.english();

export namespace Fin {

	/**
	 * ------------------------------------
	 * Main function
	 * ------------------------------------
	**/
	export function Fin (input:string):FinReturn{

		let result:FinReturn = {
			raw:"",
			intercepted:"",
			tokens:[[]],
			tags:[[]],
			deps:[[]],
			confidennce:[],
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
		result.tokens = _lexer.tokens.map((r)=>r.tokens);
		const _meta = _lexer.tokens.map((r)=>r.meta);
		
		/**
		 * ----------------
		 * 3: POS tagging
		 * ----------------
		**/
		for (var index = 0; index < result.tokens.length; index++) {
			const tokens = result.tokens[index];
			const meta = _meta[index];
			const taggingInstance = new tagger.Tag(tokens,meta);
			taggingInstance.initial();
			taggingInstance.smooth();
			result.tags[index] = taggingInstance.tags;
			result.confidennce[index] = taggingInstance.confidence.reduce((a,b)=>a+b,0) / taggingInstance.confidence.length;
			// but we can never be so sure about the dependency parsing :'(
			result.confidennce[index] = result.confidennce[index] - (((100 - result.confidennce[index]) * 0.5) || 10);
		}

		/**
		 * ----------------
		 * C: Dependency Parsing
		 * ----------------
		**/
		for (var index = 0; index < result.tokens.length; index++) {
			const tokens = result.tokens[index];
			const tags = result.tags[index];
			result.deps[index] = parser.parse(tags,tokens);
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
		detectors.unshift.apply(this,detector);
	}
	export function addInterceptor(interceptor:Interceptor|Interceptor[]){
		if(!Array.isArray(interceptor)) interceptor = [interceptor];
		interceptors.unshift.apply(interceptor);
	}

	/**
	 * 
	 * Interfaces
	 * 
	**/
	export interface Interceptor {
		(input:string):string;
	}
	export interface Detector {
		(input:FinReturn):FinReturn;
	}
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
		confidennce:number[];
		deps:DepNode[][];
	}
}