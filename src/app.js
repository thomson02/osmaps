'use strict';

import GPX from './gpxParser.js';
import Routecard from './routecard.js';


var readFile = function(){
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    
    GPX.parse(file, 3)
        .then(function(routecardData){
            routecardData.hack = "hack";
            return Routecard.create(routecardData);
        })
        .then(function(fileBlob){
            return Routecard.download(fileBlob, "routecard.docx");
        });
};

document.addEventListener("DOMContentLoaded",function(){
    document.getElementById('go').addEventListener('click', readFile, false);
});