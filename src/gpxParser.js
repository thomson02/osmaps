import Promise from 'bluebird';
import tj from 'togeojson'
var DOMParser = require('xmldom').DOMParser;
import _ from 'lodash'
import geodesy from 'geodesy'
import moment from 'moment'
import convertUnits from 'convert-units'
require('moment-duration-format');


var readGpxFile = function(file){
    return new Promise(function (resolve, reject){
        var reader = new FileReader();
        reader.onload = function(e) {
            var gpxXml = new DOMParser().parseFromString(reader.result);
            var gpxData = tj.gpx(gpxXml) || { features: [] };
            resolve(gpxData);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

var getAllPoints = function(gpxData){
    return _.chain(gpxData.features)
        .filter(function(f){ 
            return f.geometry && f.geometry.type && f.geometry.type.toUpperCase() === "LINESTRING"; 
        })
        .map(function(f){ 
            return f.geometry.coordinates; 
        })
        .flatten()
        .map(function(p){ 
            return {
                point: new geodesy.LatLonEllipsoidal(p[1], p[0]),
                elevation: p[2]
            };
        })
        .value();
};

var findIndex = function(allPoints, keyPoint){
    return _.findIndex(allPoints, function(p){
        return _.isEqual(p.point, keyPoint.point);
    });
};

var getRoutecardData = function(gpxData, walkKph){
    var allPoints = getAllPoints(gpxData);

    var keyPoints = _.chain(gpxData.features)
        .filter(function(f){
            return f.geometry && 
                f.geometry.type && 
                f.geometry.type.toUpperCase() === "POINT";   
        })
        .map(function(kp){
            var point = new geodesy.LatLonEllipsoidal(kp.geometry.coordinates[1], kp.geometry.coordinates[0]);
            
            return {
                gridRef: geodesy.OsGridRef.latLonToOsGrid(point).toString(),
                title: kp.properties && kp.properties.name ? kp.properties.name : "Unknown",
                description: kp.properties && kp.properties.desc ? kp.properties.desc : "",
                point: point,
                elevation: kp.geometry.coordinates[2]
            };
        })
        .value();

    for (var i = 0; i < keyPoints.length-1; i++) {
        var startIndex = findIndex(allPoints, keyPoints[i]);
        var endIndex = findIndex(allPoints, keyPoints[i+1]);

        var distance = 0;
        for (var j = startIndex; j < endIndex; j++){ 
            distance += (allPoints[j].point.distanceTo(allPoints[j+1].point));                  
        }

        var bearing = keyPoints[i].point.initialBearingTo(keyPoints[i+1].point);
        var climbed = keyPoints[i+1].elevation - keyPoints[i].elevation;
        var distanceConvert = convertUnits(distance).from('m').toBest();
        var time = distance / (walkKph * 1000) + (Math.floor(climbed/10) > 0 ? (Math.floor(climbed/10) * (1/60)) : 0);

        _.extend(keyPoints[i], {
            bearing: Math.round(bearing) + "°",
            direction: geodesy.Dms.compassPoint(bearing),
            distance:  distanceConvert.val.toFixed(distanceConvert.unit === "km" ? 1 : 0) + distanceConvert.unit, 
            heightClimbed: climbed.toFixed(0) + "m",
            time: moment.duration(time, "hours").format(time < 1 ? "m [mins]" : "h [hrs] m [mins]")
        });
    }

    return {
        startKeyPoint: keyPoints[0],
        keyPoints: keyPoints.slice(1, -1),
        endKeyPoint: keyPoints[keyPoints.length - 1]
    };
};

module.exports = {
    parse: function(file, walkKph){
        return new Promise(function (resolve, reject){
            readGpxFile(file)
                .then(function(gpxData){
                   resolve(getRoutecardData(gpxData, walkKph));
                });
        });
    }
};