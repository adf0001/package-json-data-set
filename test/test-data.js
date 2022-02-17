
//global variable, for html page, refer tpsvr @ npm.
package_json_data_set = require("../package-json-data-set.js");

module.exports = {

	"package_json_data_set": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";

		var npm_root_g = require("npm-root-g");	//to get the result of cmd 'npm root -g'

		npm_root_g(function (err, data) {
			if (err) { done(err); return; }
			//console.log(data);

			//prepare top
			var pkgPath = data + "/npm";
			var pkgTop = require(pkgPath + "/package.json");
			var loadPackageFunc = function (pathFrom, name, cb) {
				var packagePath = pathFrom + "/node_modules/" + name;
				cb(null, { path: packagePath, pkg: require(packagePath + "/package.json"), });
			}

			/*
			.class(topPkg, topPath, loadPackageFunc)
			
				loadPackageFunc: function(pathFrom,name,cb=function(err,{path,pkg}))
			*/
			var ds = new package_json_data_set.class(pkgTop, pkgPath, loadPackageFunc);
			console.log("top: " + ds.top.pkg.name + ", " + ds.top.pkg.version + ", " + ds.top.path);

			var ka = Object.keys(ds.top.pkg.dependencies);

			// .load(pathFrom, name, versionRange, cb)	//to load a package, return by cb(err, item)
			ds.load(ds.top.path, ka[0], ds.top.pkg.dependencies[ka[0]], (err, data) => {
				if (err) { done(err); return; }

				var item1 = data;
				console.log("load: " + item1.name + ", " + item1.pkg.version + ", " + item1.path);

				done(!(
					//data-item {name,path,pkg,versionPkg={path:pkg},main}
					ds.top.name === "npm" &&
					ds.top.pkg === pkgTop &&
					ds.top.pkg.name === "npm" &&
					ds.top.path === pkgPath &&
					//.get(name [, itemPath])	//to get from cache
					ds.get(item1.name) === item1 &&
					//.isDirect(item)	//to check if an item is directly under the top
					ds.isDirect(item1) === true &&
					//.isTop(item, byString)		//to check if an item is the top
					ds.isTop(ds.top) === true &&
					ds.isTop(item1) === false &&
					ds.isTop({ path: pkgPath, pkg: pkgTop }) === true &&
					ds.isTop({ path: pkgPath + "/", pkg: pkgTop }) === false &&
					ds.isTop({ path: pkgPath + "/", pkg: pkgTop }, true) === true &&
					ds.isTop({ path: pkgPath, pkg: JSON.parse(JSON.stringify(pkgTop)) }) === false &&
					ds.isTop({ path: pkgPath, pkg: JSON.parse(JSON.stringify(pkgTop)) }, true) === true &&
					true
				));

			});

		});

	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('package_json_data_set', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(5000); } });
