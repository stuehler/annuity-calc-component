var concat = require('concat');
const es5 = ['./dist/annuity-calc-component/runtime-es5.js','./dist/annuity-calc-component/polyfills-es5.js','./dist/annuity-calc-component/main-es5.js'];
const es2015= ['./dist/annuity-calc-component/runtime-es2015.js','./dist/annuity-calc-component/polyfills-es2015.js','./dist/annuity-calc-component/main-es2015.js'];
concat(es5, './dist/annuity-calc-component/elements-es5.js');
concat(es2015, './dist/annuity-calc-component/elements-es2015.js');