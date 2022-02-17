
// package-json-data-set @ npm, data set tool for package.json.

var semver_satisfy = require("package-json-version-tool").satisfy;
var path_tool = require("path-tool");

var packageJsonDataSet = {

	data: null,		//map package-name to data-item {name,path,pkg,versionPkg={path:pkg},main}
	top: null,		//top data-item

	loadPackageFunc: null,	//function(pathFrom,name,cb=function(err,{path,pkg}))

	init: function (topPkg, topPath, loadPackageFunc) {
		this.data = {};

		this.top = { path: topPath, name: topPkg.name, pkg: topPkg };
		this.data[topPkg.name] = this.top;
		this.loadPackageFunc = loadPackageFunc;
	},

	//to check if an item is directly under the top
	isDirect: function (item) {
		if (item === this.top) return true;
		if (item.main) return false;

		return item.path.replace(/\\/g, "/") ==
			(this.top.path + "/node_modules/" + item.name).replace(/\\/g, "/");
	},

	//to check if an item is the top
	isTop: function (item, byString) {
		if (!item || !this.top) return false;

		if (item === this.top || (item.path === this.top.path && item.pkg === this.top.pkg)) return true;

		if (!byString) return false;

		return path_tool.samePath(item.path, this.top.path) &&
			JSON.stringify(item.pkg) === JSON.stringify(this.top.pkg);
	},

	//to get from cache
	get: function (name, itemPath) {
		var item = this.data[name];
		if (!item) return null;

		return itemPath ? item.versionPkg[path_tool.keyString(itemPath)] : item;
	},

	//to load a package, return by cb(err, item)
	load: function (pathFrom, name, versionRange, cb) {
		var item = this.data[name];
		if (item) {
			if (versionRange == item.pkg.version || semver_satisfy(item.pkg.version, versionRange)) {
				cb(null, item);
				return;
			}

			//find in versionPkg
			var verPath = pathFrom.replace(/[\\\/]+$/, ""), verItem, verParentPath;
			while (true) {
				verItem = item.versionPkg[verPath + "/node_modules/" + name];
				if (verItem && semver_satisfy(verItem.pkg.version, versionRange)) {
					cb(null, verItem);
					return;
				}

				//search parent path
				verParentPath = path_tool.dirPart(verPath, true);
				if (!verParentPath || verParentPath.length >= verPath.length) break;
				verPath = verParentPath;
			}
		}

		var _this = this;
		this.loadPackageFunc(pathFrom, name,
			function (err, data) {
				if (err) { return; }
				//console.log(data);

				var srcItem = { name: name, path: data.path, pkg: data.pkg };

				if (_this.isDirect(srcItem)) {
					srcItem.versionPkg = {};	//prepare versionPkg for main
					_this.data[name] = srcItem;	//save data
					cb(null, srcItem);
					return;
				}

				if (item) {
					//save to main versionPkg
					item.versionPkg[path_tool.keyString(srcItem.path)] = srcItem;
					srcItem.main = item;
					cb(null, srcItem);
					return;
				}

				//load main from top
				_this.loadPackageFunc(_this.top.path, name,
					function (err, data) {
						if (err) { return; }
						//console.log(packagePath);

						var mainItem = { name: name, path: data.path, pkg: data.pkg, versionPkg: {} };
						mainItem.versionPkg[path_tool.keyString(srcItem.path)] = srcItem;
						_this.data[name] = mainItem;	//save main data

						srcItem.main = mainItem;

						cb(null, srcItem);
					}
				);

			}
		);
	},

}

//module

exports["class"] = function (topPkg, topPath, loadPackageFunc) {
	var o = Object.create(packageJsonDataSet);
	o.init(topPkg, topPath, loadPackageFunc);
	return o;
}
