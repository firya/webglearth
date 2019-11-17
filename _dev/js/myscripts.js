(function() {
	var debug = false;

	var cameraPerspective, cameraOrtho;
	var scene, sceneOrtho;
	var ambientLight, sunLight, lensFlare, textureFlare0, textureFlare2, textureFlare3;
	var earth, sphere, overlay, clouds, atmosphere, stars;
	var earth_uniforms, atmosphere_uniforms;
	var renderer;
	var controls;
	var tooltipCanvas, tooltipContext, tooltipTexture, tooltipMaterial, tooltip;
	var width, height;
	var textureLoader, earthMapDay, earthMapNight, earthSpecularMap, cloudsMap, starsMap;
	var geocoder;
	var cameraTween;
	var flagImage;

	var isMouseDown = false
	var isAnimated = false;
	var isStarted = false;

	var startAnimationParams = {
		time: 5000, // 5000
		latlng: [44.698447200759794, 91.20312277406845] //[44.698447200759794, 91.20312277406845]
	}

	var mousePosition = {
		x: 0,
		y: 0
	};
	var mousePositionStore = {
		x: 0,
		y: 0
	};

	// sun params
	var sunParams = {
		distance: 30,
		startRotation: Math.PI*11/6,
		azimuth: 10
	};

	//tooltip params
	var tooltipParams = {
		width: 512, 
		height: 32, 
		fontSize: 13, 
		padding: [5, 5], 
		radius: 5, 
		text: "", 
		prevText: "", 
		flagSize: [16, 11]
	};

	// earth params
	var earthParams = {
		radius: 1, 
		segments: 180,
		rotation: Math.PI, 
		cloudsSpeed: 0.00005
	};

	// POI params
	var poiArray = Array();
	var currentPOI;
	var prevPOI = false;
	var POIparams = {
		size: {
			x: 64, 
			y: 64
		}, 
		color: 0x2BAADD, 
		colorActive: 0x90D6F6
	}

	var intersectionObjects = Array();

	// Atmosphere params
	var atmosphere_params = {
		Kr: 0.002,
		Km: 0.00010,
		ESun: 20.0,
		g: -0.950,
		innerRadius: earthParams.radius,
		outerRadius: earthParams.radius*1.058,
		wavelength: [0.650, 0.570, 0.475],
		scaleDepth: 0.25,
		mieScaleDepth: 10
	};

	// camera params
	var camera_params = {
		minDistance: 2.1, // 2.0
		maxDistance: 2.7, // 2.5
		minPolarAngle: Math.PI * 0.25, // 0.25
		maxPolarAngle: Math.PI * 0.65, // 0.65
		enablePan: false, 
		rotateSpeed: 0.1, 
		enableDamping: true, 
		dampingFactor: 0.1
	}

	if (debug) {
		camera_params.minPolarAngle = 0;
		camera_params.maxPolarAngle = Math.PI;
		camera_params.minDistance = 0;
		camera_params.maxDistance = 10;
		startAnimationParams.time = 0;
	}

	var earth3d = document.getElementById('webglearth');
	var earth3d_loader = document.getElementById('webglearth_loader');
	var earth3d_loader_progress = document.getElementById('webglearth_loader_progress');
	var earth3dInstead = document.getElementById('webglearth-instead');

	var textureSize = [4096, 2048];

	var countriesArray = new Object();
	var activeCountries = {
		/*Russia: {
			name: "Россия",
			polygon: 7, 
			//latlng: [54.698447200759794, 50.20312277406845]
		}, */
		PRT: {
			name: "Португалия",
			flag: [64, 121]
		},
		ESP: {
			name: "Испания",
			flag: [0, 44]
		},
		CHE: {
			name: "Швейцария",
			flag: [128, 22]
		},
		GBR: {
			name: "Великобритания",
			latlng: [53.2156661, -3.0510678],
			flag: [160, 44]
		},
		HUN: {
			name: "Венгрия",
			flag: [16, 66]
		},
		IRL: {
			name: "Ирландия",
			flag: [48, 66]
		},
		BEL: {
			name: "Бельгия",
			flag: [48, 11]
		},
		DEU: {
			name: "Германия",
			flag: [64, 33]
		},
		ROU: {
			name: "Румыния",
			flag: [144, 121]
		},
		POL: {
			name: "Польша",
			flag: [240, 110]
		},
		NOR: {
			name: "Норвегия",
			flag: [48, 110]
		},
		BLR: {
			name: "Беларусь",
			flag: [16, 22]
		},
		Ukraine: {
			name: "Украина",
			flag: [16, 154]
		},
		USA: {
			name: "Соединенные Штаты Америки", 
			polygon: 5,
			flag: [64, 154]
		},
		TUR: {
			name: "Турция",
			flag: [192, 143]
		},
		ITA: {
			name: "Италия",
			flag: [176, 66]
		},
		AUT: {
			name: "Австрия",
			flag: [192, 0]
		},
		CZE: {
			name: "Чехия",
			flag: [48, 33]
		},
		DNK: {
			name: "Дания",
			flag: [96, 33]
		},
		LVA: {
			name: "Латвия",
			flag: [64, 88]
		},
		IRN: {
			name: "Иран",
			flag: [144, 66]
		},
		PAK: {
			name: "Пакистан",
			flag: [224, 110]
		},
		Crimea: {
			name: "Крымский федеральный округ",
			flag: [176, 121]
		},
		CFO: {
			name: "Центральный федеральный округ",
			latlng: [53.0963626, 39.4466588],
			flag: [176, 121]
		},
		YFO: {
			name: "Южный федеральный округ",
			flag: [176, 121]
		},
		SKFO: {
			name: "Северо-Кавказский федеральный округ",
			flag: [176, 121]
		},
		SZFO: {
			name: "Северо-Западный федеральный округ",
			flag: [176, 121]
		},
		PFO: {
			name: "Приволжский федеральный округ",
			flag: [176, 121]
		},
		UFO: {
			name: "Уральский федеральный округ",
			flag: [176, 121]
		},
		SFO: {
			name: "Сибирский федеральный округ",
			flag: [176, 121]
		},
		DVFO: {
			name: "Дальневосточный федеральный округ",
			flag: [176, 121]
		},
		Moscow: {
			name: "Москва",
			flag: [176, 121]
		}
	};

	var projection = d3.geo.equirectangular().translate([textureSize[0] / 2, textureSize[1] / 2]).scale(textureSize[0] * 163 / 1024);

	var fragmentEarth = "varying vec3 vNormal;\r\nvarying vec2 vUv;\r\nvarying vec4 textureCoord;\r\n\r\nuniform sampler2D dayTexture;\r\nuniform sampler2D nightTexture;\r\nuniform sampler2D cloudsTexture;\r\nuniform sampler2D specularTexture;\r\nuniform sampler2D bumpTexture;\r\n\r\nuniform vec3 sun;\r\nuniform vec3 sunDirection;\r\n\r\nuniform float cloudsRotation;\r\n\r\nvoid main(void) {\r\n\/\/ day\/night\r\nvec3 dayColor \t\t= texture2D(dayTexture, vUv).xyz;\r\nvec3 nightColor \t= texture2D(nightTexture, vUv).xyz;\r\n\r\nfloat cosAngle = dot(normalize(sunDirection), vNormal);\r\nfloat dayNightMix = clamp(cosAngle, 0.1, 0.8);\r\n\r\n\/\/ clouds\r\nvec3 cloudColor = texture2D(cloudsTexture, vUv).xyz;\r\n\/\/color = mix(color, cloudColor, 1.0);\r\n\r\n\/\/ specular map\r\nvec3 specularAmount = texture2D(specularTexture, vUv).xyz;\r\nvec3 specularColor  = vec3(0.3, 0.6, 1.0);\r\nfloat specularBrightness = 0.2;\r\nfloat inverseBlur = 20.0;\r\nfloat specularMix = pow(dot(normalize(sunDirection), vNormal), inverseBlur) * (specularAmount.z * specularBrightness);\r\n\r\n\/\/ bump map \r\n\/\/vec3 normal = normalize(texture2D(bumpTexture, textureCoord[0].st).rgb * 2.0 - 1.0);  \r\n\/*vec3 bumpColor = texture2D(bumpTexture, vUv).rgb;\r\nvec3 bump = normalize(1.0 - bumpColor);\r\nfloat bumpAmount = max(dot(bump, normalize(vec3(10.0, 5.0, 10.0))), 0.1);*\/\r\n\r\n\/\/ Atmosphere\r\nfloat intensity = 1.02 - dot(vNormal, vec3(0.0, 0.0, 1.0));\r\nvec3 atmosphere = vec3(1,1,1) * pow(intensity, 2.0);\r\n\r\n\/\/ calc color\r\nvec3 color = mix(dayColor + atmosphere, specularColor, specularMix);\r\ncolor = mix(nightColor, color, dayNightMix);\r\n\/\/color = texture2D(dayTexture, vUv).rgb * bumpAmount;\r\n\r\n\/\/ output\r\ngl_FragColor = vec4(color, 1.0);\r\n}";

	var vertexEarth = "varying vec2 vUv;\r\nvarying vec3 vNormal;\r\n\r\nuniform sampler2D bumpTexture;\r\n\r\nvoid main() {\r\nvUv = uv;\r\nvNormal = normalMatrix * normal;\r\n\r\n\/\/ bump map\r\n\/*vec4 bumpData = texture2D(bumpTexture, vUv);\r\nfloat displacement = bumpData.r \/ 30.0;\r\nvec4 newPosition = vec4((position + normal * displacement), 1.0);*\/\r\nvec4 newPosition = vec4(position, 1.0);\r\n\r\ngl_Position = projectionMatrix * modelViewMatrix * newPosition;\r\n}";

	var vertexSky = "//\n// Atmospheric scattering vertex shader\n//\n// Author: Sean O'Neil\n//\n// Copyright (c) 2004 Sean O'Neil\n//\n\nuniform vec3 v3LightPosition;  // The direction vector to the light source\nuniform vec3 v3InvWavelength;  // 1 / pow(wavelength, 4) for the red, green, and blue channels\nuniform float fCameraHeight; // The camera's current height\nuniform float fCameraHeight2; // fCameraHeight^2\nuniform float fOuterRadius;   // The outer (atmosphere) radius\nuniform float fOuterRadius2;  // fOuterRadius^2\nuniform float fInnerRadius;    // The inner (planetary) radius\nuniform float fInnerRadius2; // fInnerRadius^2\nuniform float fKrESun;     // Kr * ESun\nuniform float fKmESun;      // Km * ESun\nuniform float fKr4PI;     // Kr * 4 * PI\nuniform float fKm4PI;     // Km * 4 * PI\nuniform float fScale;     // 1 / (fOuterRadius - fInnerRadius)\nuniform float fScaleDepth;    // The scale depth (i.e. the altitude at which the atmosphere's average density is found)\nuniform float fScaleOverScaleDepth;  // fScale / fScaleDepth\n\nconst int nSamples = 3;\nconst float fSamples = 3.0;\n\nvarying vec3 v3Direction;\nvarying vec3 c0;\nvarying vec3 c1;\n\n\nfloat scale(float fCos)\n{\n  float x = 1.0 - fCos;\n return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));\n}\n\nvoid main(void)\n{\n  // Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)\n  vec3 v3Ray = position - cameraPosition;\n float fFar = length(v3Ray);\n v3Ray /= fFar;\n\n  // Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)\n  float B = 2.0 * dot(cameraPosition, v3Ray);\n float C = fCameraHeight2 - fOuterRadius2;\n float fDet = max(0.0, B*B - 4.0 * C);\n float fNear = 0.5 * (-B - sqrt(fDet));\n\n  // Calculate the ray's starting position, then calculate its scattering offset\n  vec3 v3Start = cameraPosition + v3Ray * fNear;\n  fFar -= fNear;\n  float fStartAngle = dot(v3Ray, v3Start) / fOuterRadius;\n float fStartDepth = exp(-1.0 / fScaleDepth);\n  float fStartOffset = fStartDepth * scale(fStartAngle);\n  //c0 = vec3(1.0, 0, 0) * fStartAngle;\n\n // Initialize the scattering loop variables\n float fSampleLength = fFar / fSamples;\n  float fScaledLength = fSampleLength * fScale;\n vec3 v3SampleRay = v3Ray * fSampleLength;\n vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;\n\n //gl_FrontColor = vec4(0.0, 0.0, 0.0, 0.0);\n\n // Now loop through the sample rays\n vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);\n  for(int i=0; i<nSamples; i++)\n {\n   float fHeight = length(v3SamplePoint);\n    float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));\n    float fLightAngle = dot(v3LightPosition, v3SamplePoint) / fHeight;\n    float fCameraAngle = dot(v3Ray, v3SamplePoint) / fHeight;\n   float fScatter = (fStartOffset + fDepth * (scale(fLightAngle) - scale(fCameraAngle)));\n    vec3 v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));\n\n    v3FrontColor += v3Attenuate * (fDepth * fScaledLength);\n   v3SamplePoint += v3SampleRay;\n }\n\n // Finally, scale the Mie and Rayleigh colors and set up the varying variables for the pixel shader\n gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n c0 = v3FrontColor * (v3InvWavelength * fKrESun);\n  c1 = v3FrontColor * fKmESun;\n  v3Direction = cameraPosition - position;\n}";

	var fragmentSky = "//\n// Atmospheric scattering fragment shader\n//\n// Author: Sean O'Neil\n//\n// Copyright (c) 2004 Sean O'Neil\n//\n\nuniform vec3 v3LightPos;\nuniform float g;\nuniform float g2;\n\nvarying vec3 v3Direction;\nvarying vec3 c0;\nvarying vec3 c1;\n\n// Calculates the Mie phase function\nfloat getMiePhase(float fCos, float fCos2, float g, float g2)\n{\n return 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos2) / pow(1.0 + g2 - 2.0 * g * fCos, 1.5);\n}\n\n// Calculates the Rayleigh phase function\nfloat getRayleighPhase(float fCos2)\n{\n return 0.75 + 0.75 * fCos2;\n}\n\nvoid main (void)\n{\n float fCos = dot(v3LightPos, v3Direction) / length(v3Direction);\n  float fCos2 = fCos * fCos;\n\n  vec3 color =  getRayleighPhase(fCos2) * c0 +\n          getMiePhase(fCos, fCos2, g, g2) * c1;\n\n   gl_FragColor = vec4(color, 1.0);\n  gl_FragColor.a = gl_FragColor.b;\n}";

	// preloader
	var loader = THREE.DefaultLoadingManager;
	loader.onProgress = function (item, loaded, total) {
		var percent = (loaded/total)*100;
		earth3d_loader_progress.style.width = percent+'%';
	};
	loader.onLoad = function () {
		earth3d_loader.className += " loader--loaded";
		init();
	};

	// check webGL support
	if (window.WebGLRenderingContext) {
		earth3dInstead.style.display = "none";
		loadTextures();
	} else {
		earth3d.style.display = "none";
	}

	function loadTextures() {
		textureLoader = new THREE.TextureLoader();
		earthMapDay = textureLoader.load("images/day_map.jpg");
		earthMapNight = textureLoader.load("images/nightlights.jpg");
		earthSpecularMap = textureLoader.load("images/earth_specular.png");
		cloudsMap = textureLoader.load("images/clouds_map.png");
		starsMap = textureLoader.load("images/starfield.gif");
		textureFlare0 = textureLoader.load("images/lensflare0.png");
		textureFlare2 = textureLoader.load("images/lensflare2.png");
		textureFlare3 = textureLoader.load("images/lensflare3.png");

		flagImage = new Image();
		flagImage.src = "images/flags.png";
	}

	function init() {
		d3.json('data/world4.json', function(err, data) {
			var countries = topojson.feature(data, data.objects.collection);

			geocoder = geodecoder(countries.features);

			var image = new Image;
			image.src = "images/day_map.jpg";
			image.onload = imageLoaded;

			function imageLoaded() {
				earthMapDay = createCanvasFromImageAndGeoJSON(this, countries);
				earthMapDay.needsUpdate = true;

				createScene();

				animate();
			}
		});
	}

	function createCanvasFromImageAndGeoJSON(texture, countries, fill, stroke) {
		fill = fill || {
			fillStyle: "transparent"
		};
		stroke = stroke || {
			strokeStyle: "#111C29", 
			lineWidth: 1
		}

		var mapCanvas = d3.select("body").append("canvas").attr({
			width: textureSize[0] + "px",
			height: textureSize[1] + "px"
		});

		var mapContext = mapCanvas.node().getContext("2d");

		mapContext.globalAlpha = 1;
		mapContext.drawImage(texture, 0, 0, textureSize[0], textureSize[1]);
		mapCanvas.remove();

		var path = d3.geo.path().projection(projection).context(mapContext);

		mapContext.strokeStyle = stroke.strokeStyle;
		mapContext.lineWidth = stroke.lineWidth;
		mapContext.fillStyle = fill.fillStyle;
		mapContext.beginPath();
		path(countries);
		mapContext.globalAlpha = 0;
		mapContext.stroke();
		mapContext.globalAlpha = 1;

		var texture = new THREE.Texture(mapCanvas.node());
		
		return texture;
	}

	function setPoints() {
		for (var country in countriesArray) {
			for (var countryActive in activeCountries) {
				if (country == countryActive) {
					var polygonNumber = (activeCountries[countryActive].polygon) ? activeCountries[countryActive].polygon : 0;

					if (countriesArray[countryActive].geometry.type == "Polygon") {
						var coordinates = countriesArray[countryActive].geometry.coordinates[0];
					} else {
						var coordinates = countriesArray[countryActive].geometry.coordinates[polygonNumber][0];
					}

					/*for (var i = 0; i < coordinates.length; i++) {
						if (coordinates[i][0] < 0) {
							coordinates[i][0] = 180 + coordinates[i][0];
						}
						if (coordinates[i][1] < 0) {
							coordinates[i][1] = 360 + coordinates[i][1];
						}
					}*/
					var latlng;

					if (activeCountries[countryActive].latlng) {
						latlng = activeCountries[countryActive].latlng;
					} else {
						latlng = get_polygon_centroid(coordinates);
						activeCountries[countryActive].centroid = latlng;
						latlng = Array(latlng[1], latlng[0]);
					}
					
					createPOI(latlng, activeCountries[countryActive].name, activeCountries[countryActive].flag);
				}
			}
		}
	}

	function createPOI(latlng, label, flag) {
		var pointCoord = convertToXYZ(latlng, earthParams.radius);
		var axis = new THREE.Vector3(0, 1, 0);
		var angle = earthParams.rotation - Math.PI;
		pointCoord.applyAxisAngle(axis, angle);

		var poi = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff }));
		poi.position.x = pointCoord.x;
		poi.position.y = pointCoord.y;
		poi.position.z = pointCoord.z;
		poi.scale.set(0, 0);

		scene.add(poi);

		var POIcanvas = createPOIcanvas();
		poiTexture = POIcanvas.texture;
		poiTexture.needsUpdate = true;

		var material = new THREE.SpriteMaterial({ map: poiTexture });
		var point = new THREE.Sprite(material);
		point.scale.set(0, 0);

		var screenCoord = screenToPerspective(getScreenCoordinates(poi, cameraPerspective));
		point.position.x = screenCoord.x;
		point.position.y = screenCoord.y;
		point.position.z = 1;

		sceneOrtho.add(point);

		var POIarrayItem = {
			hidden: true, 
			latlng: latlng, 
			label: label, 
			POIscreen: point, 
			POIperspective: poi, 
			POIcontext: POIcanvas.context, 
			flag: flag
		};

		intersectionObjects.push(point);
		poiArray.push(POIarrayItem);
	}

	function createPOIcanvas() {
		var POIcanvas = d3.select("body").append("canvas").attr({
			width: POIparams.size.x+"px",
			height: POIparams.size.y+"px"
		});

		var POIContext = POIcanvas.node().getContext("2d");

		POIcanvas.remove();

		drawPOI(POIContext);

		var texture = new THREE.Texture(POIcanvas.node());
		
		return {"texture": texture, "context": POIContext};

		/*

		requestAnimationFrame(animate);

		function animate(time) {
		    requestAnimationFrame(animate);
		    TWEEN.update(time);
		}*/
	}

	function showPOI(poi) {
		var to = clone(POIparams.size);
		var tween = new TWEEN.Tween({"x": 0, "y": 0})
			.stop()
			.to(to, 500)
			.easing(TWEEN.Easing.Elastic.Out)
			.onUpdate(function() {
			    poi.scale.set(this.x, this.y);
			})
			.onComplete(function() {
				poi.hidden = false;
			})
			.start();
	}

	function hidePOI(poi) {
		var from = clone(POIparams.size);
		var tween = new TWEEN.Tween(from)
			.stop()
			.to({"x": 0, "y": 0}, 500)
			.easing(TWEEN.Easing.Elastic.In)
			.onUpdate(function() {
			    poi.scale.set(this.x, this.y);
			})
			.onComplete(function() {
				poi.hidden = true;
			})
			.start();
	}

	function drawPOI(POIContext, radius, length) {
		var radius = radius || 0;
		var length = length || 0;

		POIContext.clearRect(0, 0, POIparams.size.x, POIparams.size.y);

        POIContext.beginPath();
		POIContext.arc(POIparams.size.x/2.6, POIparams.size.y/2.6, POIparams.size.x/4.7, 0, Math.PI*2, true);
		POIContext.closePath();
		POIContext.globalAlpha = 0.3;
        POIContext.fillStyle = '#ffffff';
		POIContext.fill();

        POIContext.beginPath();
		POIContext.arc(POIparams.size.x/2.6, POIparams.size.y/2.6, POIparams.size.x/13, 0, Math.PI*2, true);
		POIContext.closePath();
		POIContext.globalAlpha = 1;
        POIContext.fillStyle = '#ffffff';
		POIContext.fill();

        POIContext.beginPath();
		POIContext.arc(POIparams.size.x/2.6, POIparams.size.y/2.6, radius/2, 0, Math.PI*2, true);
		POIContext.closePath();
        POIContext.strokeStyle = "#ffffff";
		POIContext.lineWidth = 1;
		POIContext.globalAlpha = 0.5;
		POIContext.stroke();

		var lineStartX = (POIparams.size.x/2.6 + POIparams.size.x/4.7 - 2);
		var lineEndX = lineStartX + length;
		POIContext.beginPath();
		POIContext.moveTo(lineStartX, POIparams.size.y/2.6);
		POIContext.lineTo(lineEndX, POIparams.size.y/2.6);
        POIContext.strokeStyle = "#ffffff";
		POIContext.globalAlpha = 0.4;
		POIContext.stroke();
	}

	function getPOI(intersects) {
		var activeIntersect = false;
		
		for (var i = 0; i < intersects.length; i++) {
			var intersect = clone(intersects[i]);
			for (var i = 0; i < poiArray.length; i++) {
				if (intersect.object == poiArray[i].POIscreen) {
					activeIntersect = i;
					break;
				}
			}
		}

		return activeIntersect;
	}

	function hoverPOI(poi, leave) {
		var leave = leave || false;

		var start = 0;
		var end = (POIparams.size.x/1.3 - 1);
		var lengthStart = 0;
		var lengthEnd = 20;
		if (leave) {
			start = (POIparams.size.x/1.3 - 1);
			end = 0;
			lengthStart = 20;
			lengthEnd = 0;
		}

		var POItween = new TWEEN.Tween({"radius": start, "length": lengthStart})
			.to({"radius": end, "length": lengthEnd}, 300)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(function() {
			    drawPOI(poi.POIcontext, this.radius, this.length);
			    poi.POIscreen.material.map.needsUpdate = true;
			})
			.start();
	}

	function clone(obj) {
	    if (null == obj || "object" != typeof obj) return obj;
	    var copy = obj.constructor();
	    for (var attr in obj) {
	        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	    }
	    return copy;
	}

	function getScreenCoordinates(obj, camera) {
	    var vector = new THREE.Vector3();

	    var widthHalf = 0.5*width;
	    var heightHalf = 0.5*height;

	    obj.updateMatrixWorld();
	    vector.setFromMatrixPosition(obj.matrixWorld);
	    vector.project(camera);

	    vector.x = ( vector.x * widthHalf ) + widthHalf;
	    vector.y = - ( vector.y * heightHalf ) + heightHalf;

	    return { 
	        x: vector.x,
	        y: vector.y
	    };
	}

	function screenToPerspective(xy) {
		var widthHalf = 0.5*width;
		var heightHalf = 0.5*height;

		return {
			x: (xy.x - widthHalf),
			y: (heightHalf - xy.y)
		}
	}

	function createScene() {
		width = earth3d.clientWidth;
		height = earth3d.clientHeight;

		// Create scene
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x000000, 1500, 2100);
		sceneOrtho = new THREE.Scene();

		cameraPerspective = new THREE.PerspectiveCamera(60, width / height, 1, 2100);
		cameraPerspective.position.z = 30;
		scene.add(cameraPerspective);

		cameraOrtho = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 1, 2100);
		cameraOrtho.position.z = 3;

		ambientLight = new THREE.AmbientLight(0x222222);
		scene.add(ambientLight);

		window.addEventListener('resize', onWindowResize, false);

		renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.autoClear = false;

		earth3d.appendChild(renderer.domElement);
		// create earth
		earth = new THREE.Object3D();
		earth.rotation.y = earthParams.rotation;

		var sunLightPosition = {
			x: Math.sin(sunParams.startRotation)*sunParams.distance,
			y: sunParams.azimuth,
			z: Math.cos(sunParams.startRotation)*sunParams.distance,
		}
		sunLight = addLight(1.0, 1.0, 1.0, sunLightPosition.x, sunLightPosition.y, sunLightPosition.z);

		// create sphere
		earth_uniforms = {
			sunDirection: { value: sunLight.position },
			dayTexture: { value: earthMapDay },
			nightTexture: { value: earthMapNight },
			specularTexture: { value: earthSpecularMap }
		};
		sphere = createSphere(earthParams.radius, earthParams.segments, new THREE.ShaderMaterial({
			uniforms: earth_uniforms,
			vertexShader: vertexEarth,
			fragmentShader: fragmentEarth
		}));
		
		earth.add(sphere);

		// create overlay
		overlay = createSphere(earthParams.radius*1.0001, earthParams.segments, new THREE.MeshPhongMaterial({
			map: new THREE.Texture(),
			transparent: true
		}));
		earth.add(overlay);

		// atmosphere
		atmosphere_uniforms = {
			v3LightPosition: { value: new THREE.Vector3(1e8, 0, 1e8).normalize() },
			v3InvWavelength: { value: new THREE.Vector3(1 / Math.pow(atmosphere_params.wavelength[0], 4), 1 / Math.pow(atmosphere_params.wavelength[1], 4), 1 / Math.pow(atmosphere_params.wavelength[2], 4)) },
			fCameraHeight: { value: 0 },
			fCameraHeight2: { value: 0 },
			fInnerRadius: { value: atmosphere_params.innerRadius },
			fInnerRadius2: { value: atmosphere_params.innerRadius * atmosphere_params.innerRadius },
			fOuterRadius: { value: atmosphere_params.outerRadius },
			fOuterRadius2: { value: atmosphere_params.outerRadius * atmosphere_params.outerRadius },
			fKrESun: { value: atmosphere_params.Kr * atmosphere_params.ESun },
			fKmESun: { value: atmosphere_params.Km * atmosphere_params.ESun },
			fKr4PI: { value: atmosphere_params.Kr * 4.0 * Math.PI  },
			fKm4PI: { value: atmosphere_params.Km * 4.0 * Math.PI },
			fScale: { value: 1 / (atmosphere_params.outerRadius - atmosphere_params.innerRadius) },
			fScaleDepth: { value: atmosphere_params.scaleDepth },
			fScaleOverScaleDepth: { value: 1 / (atmosphere_params.outerRadius - atmosphere_params.innerRadius) / atmosphere_params.scaleDepth },
			g: { value: atmosphere_params.g },
			g2: { value: atmosphere_params.g * atmosphere_params.g },
			nSamples: { value: 3 },
			fSamples: { value: 3.0 },
			tDisplacement: {value: 0}
		};

		

		atmosphere = createSphere(atmosphere_params.outerRadius, earthParams.segments, new THREE.ShaderMaterial({
			uniforms: atmosphere_uniforms,
			vertexShader: vertexSky,
			fragmentShader: fragmentSky, 
			side: THREE.BackSide, 
			transparent: true
		}));
		
		scene.add(atmosphere);

		// create clouds
		clouds = createSphere(earthParams.radius*1.005, earthParams.segments/4, new THREE.MeshPhongMaterial({
			map: cloudsMap,
			transparent: true,
			opacity: 0.4
		}));
		earth.add(clouds);

		stars = createSphere(earthParams.radius*500, earthParams.segments/10, new THREE.MeshBasicMaterial({
			map: starsMap,
			side: THREE.BackSide
		}));
		scene.add(stars);

		// add earth to scene
		scene.add(earth);

		// wireframe
		/*var wfh = new THREE.WireframeHelper(sphere, 0xffffff);
		wfh.material.linewidth = 1;
		scene.add(wfh);*/

		//create tooltip
		tooltipCanvas = d3.select("body").append("canvas").attr({
			width: tooltipParams.width + "px",
			height: tooltipParams.height + "px"
		});

		tooltipContext = tooltipCanvas.node().getContext("2d");
		tooltipContext.font = tooltipParams.fontSize + "px Roboto";
		tooltipContext.textAlign = "left";

		tooltipTexture = new THREE.Texture(tooltipCanvas.node()) 
		tooltipTexture.needsUpdate = true;

		tooltipMaterial = new THREE.SpriteMaterial({ map: tooltipTexture });
		tooltip = new THREE.Sprite(tooltipMaterial);
		tooltip.scale.set(tooltipParams.width, tooltipParams.height, 1.0);
		tooltip.position.set(0, 0, 1);
		sceneOrtho.add(tooltip);

		tooltipCanvas.remove();

		controls = new THREE.OrbitControls(cameraPerspective, earth3d);

		startAnimation();
	}

	function createSphere(radius, segments, material) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			material
		);
	}

	function addLight(h, s, l, x, y, z) {
		var light = new THREE.PointLight( 0xffffff, 1.5, 2000 );
		light.color.setHSL( h, s, l );
		light.position.set( x, y, z );
		scene.add( light );
		var flareColor = new THREE.Color( 0xffffff );
		flareColor.setHSL( h, s, l + 0.5 );
		lensFlare = new THREE.LensFlare( textureFlare0, 1000, 0.0, THREE.AdditiveBlending, flareColor );
		lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );

		lensFlare.position.copy( light.position );
		scene.add( lensFlare );

		return light;
	}

	function lensFlareUpdateCallback( object ) {
		var f, fl = object.lensFlares.length;
		var flare;
		var vecX = -object.positionScreen.x * 2;
		var vecY = -object.positionScreen.y * 2;
		for( f = 0; f < fl; f++ ) {
			flare = object.lensFlares[ f ];
			flare.x = object.positionScreen.x + vecX * flare.distance;
			flare.y = object.positionScreen.y + vecY * flare.distance;
			flare.rotation = 0;
		}
		object.lensFlares[ 2 ].y += 0.025;
		object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );
	}

	function startAnimation() {
		moveCamera(startAnimationParams.latlng, startAnimationParams.time, camera_params.maxDistance, function() {
			startScene();
		});
		rotateEarth(3, startAnimationParams.time);
		rotateSun(-1, startAnimationParams.time);
	}

	function startScene() {
		//add orbit controls
		controls.minDistance = camera_params.minDistance;
		controls.maxDistance = camera_params.maxDistance;
		controls.minPolarAngle = camera_params.minPolarAngle;
		controls.maxPolarAngle = camera_params.maxPolarAngle;
		controls.enablePan = camera_params.enablePan;
		controls.rotateSpeed = camera_params.rotateSpeed;
		controls.enableDamping = camera_params.enableDamping;
		controls.dampingFactor = camera_params.dampingFactor;

		setPoints();

		document.addEventListener('click', onDocumentClick, false);
		document.addEventListener('mousedown', onDocumentMouseDown, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);

		renderRecalc();
	}

	function onWindowResize() {
		renderRecalc();
	}

	function renderRecalc() {
		width = earth3d.clientWidth;
		height = earth3d.clientHeight;

		cameraPerspective.aspect = width / height;
		cameraPerspective.updateProjectionMatrix();

		cameraOrtho.left = - width / 2;
		cameraOrtho.right = width / 2;
		cameraOrtho.top = height / 2;
		cameraOrtho.bottom = - height / 2;
		cameraOrtho.updateProjectionMatrix();

		renderer.setSize(width, height);
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
	}

	function render() {
		if (controls !== undefined) {
			controls.update();

			if (isAnimated) {
				controls.enabled = false;
			} else {
				controls.enabled = true;
			}
		}

		clouds.rotation.y += earthParams.cloudsSpeed;

		var sunLightNormalize = new THREE.Vector3();
		var cameraQuaternion = new THREE.Quaternion();
		cameraQuaternion = cameraPerspective.quaternion.clone().inverse();
		sunLightNormalize.copy(sunLight.position).applyQuaternion(cameraQuaternion).normalize();

		earth_uniforms.sunDirection.value = sunLightNormalize;

		var cameraHeight = cameraPerspective.position.length();
		atmosphere_uniforms.v3LightPosition.value = sunLightNormalize;
		atmosphere_uniforms.fCameraHeight.value = cameraHeight;
		atmosphere_uniforms.fCameraHeight2.value = cameraHeight * cameraHeight;

		if (debug) {
			atmosphere_uniforms.v3InvWavelength.value = new THREE.Vector3(1 / Math.pow(atmosphere_params.wavelength[0], 4), 1 / Math.pow(atmosphere_params.wavelength[1], 4), 1 / Math.pow(atmosphere_params.wavelength[2], 4));
			atmosphere_uniforms.fInnerRadius.value = atmosphere_params.innerRadius;
			atmosphere_uniforms.fInnerRadius2.value = atmosphere_params.innerRadius * atmosphere_params.innerRadius;
			atmosphere_uniforms.fOuterRadius.value = atmosphere_params.outerRadius;
			atmosphere_uniforms.fOuterRadius2.value = atmosphere_params.outerRadius * atmosphere_params.outerRadius;
			atmosphere_uniforms.fKrESun.value = atmosphere_params.Kr * atmosphere_params.ESun;
			atmosphere_uniforms.fKmESun.value = atmosphere_params.Km * atmosphere_params.ESun;
			atmosphere_uniforms.fKr4PI.value = atmosphere_params.Kr * 4.0 * Math.PI;
			atmosphere_uniforms.fKm4PI.value = atmosphere_params.Km * 4.0 * Math.PI;
			atmosphere_uniforms.fScale.value = 1 / (atmosphere_params.outerRadius - atmosphere_params.innerRadius);
			atmosphere_uniforms.fScaleDepth.value = atmosphere_params.scaleDepth;
			atmosphere_uniforms.fScaleOverScaleDepth.value = 1 / (atmosphere_params.outerRadius - atmosphere_params.innerRadius) / atmosphere_params.scaleDepth;
			atmosphere_uniforms.g.value = atmosphere_params.g;
			atmosphere_uniforms.g2.value = atmosphere_params.g * atmosphere_params.g;
		}

		// hide/show POI
		for (var i = 0; i < poiArray.length; i++) {
			var screenCoord = screenToPerspective(getScreenCoordinates(poiArray[i].POIperspective, cameraPerspective));
			poiArray[i].POIscreen.position.x = screenCoord.x;
			poiArray[i].POIscreen.position.y = screenCoord.y;

			if (i == currentPOI) {
				tooltip.position.x = poiArray[i].POIscreen.position.x + tooltipParams.width/2 + POIparams.size.x/2;
				tooltip.position.y = poiArray[i].POIscreen.position.y + 2;
			}

			var cameraVector = cameraPerspective.position.clone().normalize();
			var poiVector = poiArray[i].POIperspective.position.clone().normalize();

			var axisY = new THREE.Vector3(0, 1, 0);
			var angle = 0;
			poiVector.applyAxisAngle(axisY, angle);

			var angle = Math.acos(cameraVector.x*poiVector.x + cameraVector.y*poiVector.y + cameraVector.z*poiVector.z);

			if (angle > Math.PI*0.3 && !poiArray[i].hidden) {
				hidePOI(poiArray[i].POIscreen);
				poiArray[i].hidden = true;
			}
			if (angle <= Math.PI*0.3 && poiArray[i].hidden) {
				showPOI(poiArray[i].POIscreen);
				poiArray[i].hidden = false;
			}
		}

		renderer.clear();
		renderer.render(scene, cameraPerspective);
		renderer.clearDepth();
		renderer.render(sceneOrtho, cameraOrtho);
	}

	function onDocumentMouseDown(event) {
		isMouseDown = true;
		mousePositionStore = {
			x: event.clientX, 
			y: event.clientY
		};
	}

	function onDocumentMouseUp(event) {
		isMouseDown = false;
	}

	function onDocumentClick(event) {
		if (mousePositionStore.x == event.clientX && mousePositionStore.y == event.clientY) {
			var intersects = findIntersection(event);
			
			var activePOI = getPOI(intersects);

			console.log(activePOI);

			if (activePOI !== false) {
				selectPOI(activePOI);
			}
		}
	}

	function selectPOI(activePOI) {
		var cameraDistance = Math.sqrt(cameraPerspective.position.x*cameraPerspective.position.x + cameraPerspective.position.y*cameraPerspective.position.y + cameraPerspective.position.z*cameraPerspective.position.z);

		moveCamera(poiArray[activePOI].latlng, 500, cameraDistance, function() {
			openWindow(poiArray[activePOI].label);
		});
	}

	function onDocumentMouseMove(event) {
		var tooltipPOI = {};

		if (!isMouseDown || (isMouseDown && mousePositionStore.x == event.clientX && mousePositionStore.y == event.clientY)) {
			var intersects = findIntersection(event);

			var activePOI = getPOI(intersects);

			if (activePOI !== false) {
				renderer.domElement.style.cursor = "pointer";
				currentPOI = activePOI;
				if (currentPOI != prevPOI) {
					if (prevPOI !== false) {
						hoverPOI(poiArray[prevPOI], true);
					}
					hoverPOI(poiArray[currentPOI]);
				}

				tooltipPOI = poiArray[currentPOI];

				prevPOI = currentPOI;
			} else {
				if (prevPOI !== false) {
					hoverPOI(poiArray[prevPOI], true);
				}
				renderer.domElement.style.cursor = "auto";
				prevPOI = false;
			}
		}
		
		var tooltipTween = new TWEEN.Tween({"opacity": 0})
			.stop()
			.to({"opacity": 1}, 300)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(function() {
			    redrawTooltip(tooltipPOI, this.opacity);
			})
			.start();
	}

	function findIntersection(event) {
		mousePosition.x = ((event.clientX - earth3d.getBoundingClientRect().left) / width) * 2 - 1;
		mousePosition.y = -((event.clientY - earth3d.getBoundingClientRect().top) / height) * 2 + 1;

		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mousePosition, cameraOrtho);
		var intersects = raycaster.intersectObjects(intersectionObjects, false);

		return intersects;
	}

	function moveCamera(latlng, time, distance, callback) {
		var callback = callback || function() {};
		var distance = distance || Math.sqrt(cameraPerspective.position.x*cameraPerspective.position.x + cameraPerspective.position.y*cameraPerspective.position.y + cameraPerspective.position.z*cameraPerspective.position.z);

		isAnimated = true;

		var startPosition = { x : cameraPerspective.position.x, y: cameraPerspective.position.y, z: cameraPerspective.position.z };

		var targetPosition = convertToXYZ(latlng, distance);
		var axis = new THREE.Vector3(0, 1, 0);
		var angle = earthParams.rotation - Math.PI;
		targetPosition.applyAxisAngle(axis, angle);

		cameraTween = new TWEEN.Tween(startPosition)
			.to(targetPosition, time)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(function() {
			    cameraPerspective.position.x = this.x;
			    cameraPerspective.position.y = this.y;
			    cameraPerspective.position.z = this.z;
			})
			.onComplete(function() {
				isAnimated = false;
				callback();
			})
			.start();

		requestAnimationFrame(tweenanimate);

		function tweenanimate(time) {
		    requestAnimationFrame(tweenanimate);
		    TWEEN.update(time);
		}
	}

	function rotateEarth(times, time) {
		var startRotation = { y: earth.rotation.y };
		var targetRotation = { y: (earth.rotation.y + times*2*Math.PI) };
		var tween = new TWEEN.Tween(startRotation)
			.to(targetRotation, time)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(function() {
			    earth.rotation.y = this.y;
			})
			.start();

		requestAnimationFrame(tweenanimate);

		function tweenanimate(time) {
		    requestAnimationFrame(tweenanimate);
		    TWEEN.update(time);
		}
	}

	function rotateSun(times, time) {
		var startRotation = { angle: sunParams.startRotation };
		var targetRotation = { angle: (sunParams.startRotation + times*2*Math.PI) };
		var tween = new TWEEN.Tween(startRotation)
			.to(targetRotation, time)
			.onUpdate(function() {
			    sunLight.position.x = Math.sin(this.angle)*sunParams.distance;
				sunLight.position.z = Math.cos(this.angle)*sunParams.distance;
				lensFlare.position.copy(sunLight.position);
			})
			.start();

		requestAnimationFrame(tweenanimate);

		function tweenanimate(time) {
		    requestAnimationFrame(tweenanimate);
		    TWEEN.update(time);
		}
	}

	function redrawTooltip(poi, opacity) {
		var opacity = opacity || 1;
		var text = (poi.hasOwnProperty("label")) ? poi.label : "";
		if (text != tooltipParams.prevText) {
			tooltipContext.clearRect(0, 0, tooltipParams.width, tooltipParams.height);
			tooltipContext.globalAlpha = opacity;

			if (text != "") {
				/*var metrics = tooltipContext.measureText(text);

				var tooltipSizes = [(parseInt(metrics.width) + tooltipParams.padding[1]), tooltipParams.height];
				var tooltipX = (tooltipParams.width - tooltipSizes[0])/2;
				var tooltipY = 0;

				var tooltipGradient = tooltipContext.createLinearGradient(0, 0, 0, tooltipParams.height);
				tooltipGradient.addColorStop(0, "#1a2880");
				tooltipGradient.addColorStop(1, "#0c1d63");
				tooltipContext.fillStyle = tooltipGradient;

				tooltipContext.beginPath();
				tooltipContext.moveTo(tooltipX + tooltipParams.radius, tooltipY);
				tooltipContext.lineTo(tooltipX + tooltipSizes[0] - tooltipParams.radius, tooltipY);
				tooltipContext.quadraticCurveTo(tooltipX + tooltipSizes[0], tooltipY, tooltipX + tooltipSizes[0], tooltipY + tooltipParams.radius);
				tooltipContext.lineTo(tooltipX + tooltipSizes[0], tooltipY + tooltipSizes[1] - tooltipParams.radius);
				tooltipContext.quadraticCurveTo(tooltipX + tooltipSizes[0], tooltipY + tooltipSizes[1], tooltipX + tooltipSizes[0] - tooltipParams.radius, tooltipY + tooltipSizes[1]);
				tooltipContext.lineTo(tooltipX + tooltipParams.radius, tooltipY + tooltipSizes[1]);
				tooltipContext.quadraticCurveTo(tooltipX, tooltipY + tooltipSizes[1], tooltipX, tooltipY + tooltipSizes[1] - tooltipParams.radius);
				tooltipContext.lineTo(tooltipX, tooltipY + tooltipParams.radius);
				tooltipContext.quadraticCurveTo(tooltipX, tooltipY, tooltipX + tooltipParams.radius, tooltipY);
				tooltipContext.closePath();
				tooltipContext.fill();*/

				tooltipContext.drawImage(
					flagImage, 
					poi.flag[0], 
					poi.flag[1], 
					tooltipParams.flagSize[0], 
					tooltipParams.flagSize[1], 
					0, 
					tooltipParams.height/2 - tooltipParams.flagSize[1], 
					tooltipParams.flagSize[0], 
					tooltipParams.flagSize[1]
				);

				tooltipContext.fillStyle = "rgba(255, 255, 255, 1)";
				tooltipContext.fillText(text.toUpperCase(), tooltipParams.flagSize[0]+5, tooltipParams.height/2 - 1);
			}

			tooltipTexture.needsUpdate = true;
		}
		tooltipParams.prevText = text;
	}

	function getEventCenter(object, intersects, radius) {
		radius = radius || 200;

		var point = getPoint(object, intersects);

		var latRads = Math.acos(point.y / radius);
		var lngRads = Math.atan2(point.z, point.x);
		var lat = (Math.PI / 2 - latRads) * (180 / Math.PI);
		var lng = (Math.PI - lngRads) * (180 / Math.PI);

		return [lat, lng - 180];
	}

	function getPoint(object, intersects) {
		// Get the vertices
		var a = object.geometry.vertices[intersects.face.a];
		var b = object.geometry.vertices[intersects.face.b];
		var c = object.geometry.vertices[intersects.face.c];

		// Averge them together
		var point = {
			x: (a.x + b.x + c.x) / 3,
			y: (a.y + b.y + c.y) / 3,
			z: (a.z + b.z + c.z) / 3
		};

		return point;
	}

	function pointInPolygon(poly, point) {
		var x = point[0];
		var y = point[1];

		var inside = false,
			xi, xj, yi, yj, xk;

		for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			xi = poly[i][0];
			yi = poly[i][1];
			xj = poly[j][0];
			yj = poly[j][1];

			xk = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (xk) {
				inside = !inside;
			}
		}

		return inside;
	}

	function geodecoder(features) {
		for (var i = 0; i < features.length; i++) {
			countriesArray[features[i].id] = features[i];
		}

		return {
			find: function(id) {
				return countriesArray[id];
			},
			search: function(lat, lng) {
				var match = false;

				var country, coords;

				for (var i = 0; i < features.length; i++) {
					country = features[i];

					if (country.geometry.type === 'Polygon') {
						match = pointInPolygon(country.geometry.coordinates[0], [lng, lat]);
						if (match) {
							return {
								code: features[i].id,
								name: features[i].properties.name
							};
						}
					} else if (country.geometry.type === 'MultiPolygon') {
						coords = country.geometry.coordinates;
						for (var j = 0; j < coords.length; j++) {
							match = pointInPolygon(coords[j][0], [lng, lat]);
							if (match) {
								return {
									code: features[i].id,
									name: features[i].properties.name
								};
							}
						}
					}
				}

				return null;
			}
		};
	};

	function convertToXYZ(point, radius) {
		radius = radius || 200;

		var latRads = (90 - point[0]) * Math.PI / 180;
		var lngRads = (180 - point[1]) * Math.PI / 180;

		var x = radius * Math.sin(latRads) * Math.cos(lngRads);
		var y = radius * Math.cos(latRads);
		var z = radius * Math.sin(latRads) * Math.sin(lngRads);

		return new THREE.Vector3(x, y, z);
	}

	function get_polygon_centroid(arr) {
		var twoTimesSignedArea = 0;
		var cxTimes6SignedArea = 0;
		var cyTimes6SignedArea = 0;

		var length = arr.length

		var x = function (i) { return arr[i % length][0] };
		var y = function (i) { return arr[i % length][1] };

		for ( var i = 0; i < arr.length; i++) {
			var twoSA = x(i)*y(i+1) - x(i+1)*y(i);
			twoTimesSignedArea += twoSA;
			cxTimes6SignedArea += (x(i) + x(i+1)) * twoSA;
			cyTimes6SignedArea += (y(i) + y(i+1)) * twoSA;
		}
		var sixSignedArea = 3 * twoTimesSignedArea;
		return [ cxTimes6SignedArea / sixSignedArea, cyTimes6SignedArea / sixSignedArea]; 
	}

	function openWindow(text) {
		console.log(text);
	}
}());