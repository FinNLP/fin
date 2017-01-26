const fin = require('./index.js');
const assert = require('assert');


describe('Basic checks', function () {

	var input = "This is a sentence";
	var instance = new fin(input);
	it('instance is an object', function () {
		assert.equal(typeof instance.hasOwnProperty,"function");
	});
	it('input is a string', function () {
		assert.equal(instance.input,input);
	});
	it('result is an array', function () {
		assert.equal(Array.isArray(instance.result),true);
	});
	it('sentences is an array', function () {
		assert.equal(Array.isArray(instance.sentences),true);
	});
	it('tokens is an array', function () {
		assert.equal(Array.isArray(instance.result[0].tokens),true);
	});
	it('tags is an array', function () {
		assert.equal(Array.isArray(instance.result[0].tags),true);
	});
	it('tokenizationMeta is an array', function () {
		assert.equal(Array.isArray(instance.result[0].tokenizationMeta),true);
	});
	it('deps is an array', function () {
		assert.equal(Array.isArray(instance.result[0].deps),true);
	});
	it('raw is a string', function () {
		assert.equal(typeof instance.result[0].raw,"string");
	});
});

describe('Extensibility', function () {

	describe('interceptors', function () {
		it('intercept', function () {
			var sentence = "something";
			fin.extend({
				id:"interceptor",
				extension:(str)=>str+" something else"
			});
			var instance = new fin(sentence);
			assert.equal(instance.result[0].tokens.length,3);
		});
	});

	describe('detectors', function () {
		var input = "This is a sentence. And this is another one.";
		it('Single extension', function () {
			fin.extend({
				id:"len",
				extension:function(){
					return this.sentences.length;
				}
			});
			var instance = new fin(input);
			assert.equal(instance.len(),3);
		});
		it('Multiple extensions', function () {
			fin.extend([
				{
					id:"a",
					extension:function(){
						return this.sentences.length;
					}
				},
				{
					id:"b",
					extension:function(){
						return this.sentences.length;
					}
				}
			]);
			var instance = new fin(input);
			assert.equal(instance.a(),3);
			assert.equal(instance.b(),3);
		});
		it('Extending the lexicon', function () {
			fin.extend({
				id:"lexicon",
				extension:{
					"abcdefgh":"PR"
				}
			});
			var instance = new fin("abcdefgh");
			console.log(instance);
		});
	});
});

