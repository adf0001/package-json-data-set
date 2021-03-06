# package-json-data-set
data set tool for package.json

# Install

```
npm install package-json-data-set
```

# Usage & Api

```javascript

var package_json_data_set = require("package-json-data-set");

var npm_root_g = require("npm-root-g");	//to get the result of cmd 'npm root -g'

npm_root_g(function (err, data) {
	if (err) { done(err); return; }

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
			//.isTop(item)		//to check if an item is the top
			ds.isTop(ds.top) === true &&
			ds.isTop(item1) === false &&
			true
		));
	});
});

```
