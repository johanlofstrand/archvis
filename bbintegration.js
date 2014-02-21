/*
Handles bitbucket integration. 
 - Coded in an elaborative manner with the purpose to be used for archvis, an internal architecture visualisation tool. H
@author Johan Löfstrand
*/


exports.bbInitiate = function(callback) {
    console.log("bbInitiate");
    
    var items = ['svtlib-observable','svtlib-messagechannel','svtlib-toggle-visibility','svtlib-slidablelist','svtlib-svtplayer','svtlib-carousel','barnkanalen-play'];
    //var items = ['barnkanalen-play'];
    

    var async = require("async");

     /*
        Run bitbucket access in parallell but fork result in order to feed d3 all data at the same time... 
     */
    async.map(items,bbRepoRun, function(err,svtlibs) {
        if (err) {
            console.log(err);
        }
        var merged = [];
        merged = merged.concat.apply(merged, svtlibs);
        //console.log("Got: ");
        //console.log(merged);
        callback(merged);
    });

}

/*
    Runs REST call to bitbucket for the repo. 
    callback param is just for async to work, see call from bbInitiate
*/
var bbRepoRun = function(repo,callback) {
    var svtlibs = new Array();
    var bitbucket = require('bitbucket-api');
    var credentials = {username: 'architecturevisualizer', password: 'VfAvApSVTi1'}; //read only account... 
    var client = bitbucket.createClient(credentials);
    
    client.getRepository({slug: repo, owner: 'svtidevelopers'}, function (err, repository) {
            
        if (repository) {

            console.log("Try to fetch repo: " + repository.slug + " of type: " + repository.scm);

            if (repository.scm == "git") {
                revision = "master";
            }
            else {
                revision = "default";
            }
            
            var bower = repository.sources('/bower.json', revision).info(function (err, result) {

                if (result) { 
                    resjsonb = JSON.parse(result.data);
                    var deps = resjsonb.dependencies;
                    if (deps) {
                        var keys = Object.keys(deps);
                        if (keys) {
                            for (i=0;i<keys.length;i++) {
                                if (keys[i].match('^svtlib')) { 
                                    svtlibs.push({source: repository.slug, target: keys[i], type: "dependency"});               
                                }
                                else {
                                    svtlibs.push({source: repository.slug, target: (keys[i] + ' ' + deps[keys[i]]), type: "framework"});     
                                }
                            }
                        }
                    }
                    callback(err,svtlibs);
                }
                if (err) {
                    console.log("Error when reading from repo: " + repo + " err: " + err);
                }        
            });
        }
        if (err) {
            console.log("Error when trying to fetch repo: " + repo + " err: " + err);
        }
    });
    return;

}

/*bitbucket rest api test
//GIT EX:
https://bitbucket.org/api/1.0/repositories/svtidevelopers/svtlib-messagechannel/src/master/bower.json

//MERCURIAL EX: (note default instead of master as revision...)
https://bitbucket.org/api/1.0/repositories/svtidevelopers/barnkanalen-play/src/default/bower.json
*/