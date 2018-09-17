var request = require('request');
var keys = require('../../config/keys');
var token;
var groupName = 'lucid';


function getProjectsData (groupRequested,loginUser, callback) {
    token = loginUser.accessToken;
    console.log('Requested for Group data: ',groupRequested);
    var groupProjectsURL;
    if(groupRequested == 0) {
        groupProjectsURL = keys.baseURL + '/api/v4/groups/' + groupName + '/projects?membership=true&starred=true&order_by=last_activity_at&access_token=' + token + '&per_page=100';
    } else {
        groupProjectsURL = keys.baseURL + '/api/v4/groups/' + groupRequested + '/projects?access_token=' + token + '&per_page=100';
    }
    console.log(groupProjectsURL);

    requestData(groupProjectsURL, function(projectsData) {
        if(projectsData == null) {
            if(loginUser.is_admin == true) {
                getAllUsersList(token, function (responseAdminData) {
                    callback(projectsData, responseAdminData);
                    return;
                })
            } else {
                callback(projectsData, null);
                return;
            }
        }

        getMilestones(projectsData, function (projectsMilestonesData,allMSData) {
            if(allMSData.length == 0) {
                if(loginUser.is_admin == true) {
                    getAllUsersList(token, function (responseAdminData) {
                        callback(projectsMilestonesData, responseAdminData);
                        return;
                    })
                } else {
                    console.log('Normal User Response Back !!! ')
                    callback(projectsMilestonesData, null);
                    return;
                }
            }

            getIssues(allMSData, function (milestoneIssuesData) {

                var objData = refStructureObject(projectsMilestonesData,milestoneIssuesData)

                // console.log(projectsData);
                var count = 0;
                projectsData.forEach(function(currentProject) {
                    var UsersRequestURL = currentProject._links.members+'?access_token=' + token;
                    // var UsersRequestURL = 'http://gitlab.13-bits.de/api/v4/projects/'+currentProject.id+'/repository/contributors?access_token=' + token;
                    currentProject.UsersRequestURL = UsersRequestURL;
                    requestData(UsersRequestURL, function (projectUsersList) {
                        currentProject.users = projectUsersList;
                        count++;
                        if(projectsData.length == count) {
                            if(loginUser.is_admin == true) {
                                getAllUsersList(token, function (responseAdminData) {
                                    callback(objData, responseAdminData);
                                })
                            } else {
                                callback(objData, null);
                            }
                        }
                    })
                });

            })
        })
    })
}


function requestData (url, callback) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body)
            callback(data);
        } else if (!error && response.statusCode == 404) {
            console.log("Sorry You don't have access to projects !!!")
            callback(null);
            return;
        } else {
            console.log(error);
        }
    })
}

function getMilestones(projectsData, callback) {

    var tempHolder = [];
    var tempMSHolder = [];
    projectsData.forEach(function(currentProject) {
        var milestonesURL = keys.baseURL+'/api/v4/projects/'+currentProject.id+'/milestones?access_token='+token;

        requestData(milestonesURL,function(milestones){
            milestones.forEach(function(currentMilestone) {
                tempMSHolder.push(currentMilestone);
            })
            tempHolder.push({
                project:currentProject,
                milestones:milestones,
            });
            if(projectsData.length == tempHolder.length) {
                callback(tempHolder, tempMSHolder);
            }

        });
    });
}

function getIssues(allMSData, callback) {
    var count = 0;
    allMSData.forEach(function(currentMS) {
        var issueURL = keys.baseURL+'/api/v4/projects/'+currentMS.project_id+'/milestones/'+currentMS.id+'/issues?access_token='+token;
        requestData(issueURL,function(issues){
            currentMS['issues'] = issues
            currentMS['milestoneWeight'] = null;
            count++;
            if(allMSData.length == count) {
                allMSData = calculateMSWeight(allMSData);
                callback(allMSData)
            }
        });
    })
}

function getAllUsersList(token, callback) {
    var allUsersListURL = keys.baseURL+'/api/v4/users?access_token='+token + '&per_page=100';
    requestData(allUsersListURL,function(allUsersList) {
        callback(allUsersList);
    })
}

function refStructureObject(milestones,issues) {
    for(var l=0; l<milestones.length ; l++){
        var msObj = milestones[l].milestones;
        for(var m=0; m<msObj.length; m++){
            for(var n=0; n<issues.length; n++){
                if(issues[n].id == msObj[m].id){
                    msObj[m] = issues[n];
                }
            }
        }
    }
    return milestones;
}

function calculateMSWeight(ms) {
    ms.forEach(function (current) {
        var sum = 0;
        for(var i=0; i<current.issues.length; i++){
            sum = sum + (current.issues[i].weight + 1);
        }
        current.milestoneWeight = sum;
    })
    return ms;
}

module.exports = getProjectsData;
