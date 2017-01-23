const langr = require('./index.js');
const assert = require('assert');


describe('Basic checks', function () {

	var input = "This is a sentence";
	var instance = new langr(input);
	it('instance is an object', function () {
		assert.equal(typeof instance.hasOwnProperty,"function");
	});
	it('input is a string', function () {
		assert.equal(instance.input,input);
	});
	it('output is an array', function () {
		assert.equal(Array.isArray(instance.output),true);
	});
	it('sentences is an array', function () {
		assert.equal(Array.isArray(instance.sentences),true);
	});
	it('tokens is an array', function () {
		assert.equal(Array.isArray(instance.output[0].tokens),true);
	});
	it('tags is an array', function () {
		assert.equal(Array.isArray(instance.output[0].tags),true);
	});
	it('tokenizationMeta is an array', function () {
		assert.equal(Array.isArray(instance.output[0].tokenizationMeta),true);
	});
	it('deps is an array', function () {
		assert.equal(Array.isArray(instance.output[0].deps),true);
	});
	it('raw is a string', function () {
		assert.equal(typeof instance.output[0].raw,"string");
	});
});

describe('Extensibility', function () {

	var input = "This is a sentence. And this is another one.";
	it('Single extension', function () {
		langr.extend({
			id:"len",
			detector:function(){
				return this.sentences.length;
			}
		});
		var instance = new langr(input);
		assert.equal(instance.len(),2);
	});
	it('Multiple extensions', function () {
		langr.extend([
			{
				id:"a",
				detector:function(){
					return this.sentences.length;
				}
			},
			{
				id:"b",
				detector:function(){
					return this.sentences.length;
				}
			}
		]);
		var instance = new langr(input);
		assert.equal(instance.a(),2);
		assert.equal(instance.b(),2);
	});
});

