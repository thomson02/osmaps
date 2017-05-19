import Promise from 'bluebird';
import Docxtemplater from 'docxtemplater';
import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import FileSave from 'file-saver';
import exampleDocxUrl from './template.docx';
import expressions from 'angular-expressions';

module.exports = {
    create: function(routecardData) {
        return new Promise(function (resolve, reject){
            JSZipUtils.getBinaryContent(exampleDocxUrl, function(err, content){
                if (err){
                    reject(err);    
                }

                var zip = new JSZip(content);
                var doc = new Docxtemplater().loadZip(zip);
                var angularParser= function(tag){
                    var expr=expressions.compile(tag);
                    return {get:expr};
                };

                doc.setOptions({parser:angularParser})
                doc.setData(routecardData);

                try {
                    doc.render();
                }
                catch (error){
                    reject(error);
                }

                var out = doc.getZip().generate({ 
                    type: 'blob', 
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});

                resolve(out);
            });
        });
    },
    download: function(fileBlob, fileName){
        FileSave.saveAs(fileBlob, fileName);    
    }
};