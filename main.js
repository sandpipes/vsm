var courses = [];
var courseDict = NaN;
var emptyCourses = [];

// crappy code written a while ago

String.prototype.repeat = function(times) {
    return (new Array(times + 1)).join(this);
};

$( document ).ready(function() {
    $.ajaxSetup({ cache: false });
    $.getJSON('allcourses.json', function(data) {
        courseDict = data;

        let oneFail = false;
        
        try{
            let u = window.location.href;
            let url = new URL(u);
            let c = url.searchParams.get("c");
            let e = url.searchParams.get("e");

            if(c == null) {
                let urlCourses = url.searchParams.get("courses");
                let urlEmptyCourses = url.searchParams.get("emptycourses");
                let cDict = null;
                let ecDict = null;

                if(urlCourses != null) {
                    cDict = JSON.parse(decodeURIComponent(urlCourses));
                    Object.keys(cDict).forEach(function(key) {
                        if(!add(key, cDict[key]) && !oneFail) oneFail = true;
                    });
                }
                if(urlEmptyCourses != null) {
                    ecDict = JSON.parse(decodeURIComponent(urlEmptyCourses));
                    Object.keys(ecDict).forEach(function(key) {
                        if(!add(key, ecDict[key]) && !oneFail) oneFail = true;
                    });
                }
            } else {
                //accounting for old way of saving
                if(c != null) courses = JSON.parse(decodeURIComponent(c));
                if(e != null) emptyCourses = JSON.parse(decodeURIComponent(e));
            }
        }catch(err){
            courses = [];
            emptyCourses = [];
        }

        if(oneFail) document.getElementById("errormsg").innerHTML = "Course(s) were removed due to conflict with old data.";

        refresh();
    });
});

function toMinutes(a){
    return parseInt(a[0]) * 60 + parseInt(a[1]);
}

function updateURL(){
    let main = location.protocol + '//' + location.host + location.pathname;
    let url = main;
    /*
    //old dumb way of saving courses
    if(courses.length > 0 || emptyCourses.length > 0) url += "?";
    if(courses.length > 0) url += "c=" + encodeURIComponent(JSON.stringify(courses)) + "&";
    if(emptyCourses.length > 0) url += "e=" + encodeURIComponent(JSON.stringify(emptyCourses));
    */

    var cDict = {}
    var ecDict = {}

    Object.keys(courses).forEach(function(key) {
        cDict[courses[key]["id"]] = courses[key]["section"];
    });

    Object.keys(emptyCourses).forEach(function(key) {
        ecDict[emptyCourses[key]["id"]] = emptyCourses[key]["section"];
    });

    if(courses.length > 0 || emptyCourses.length > 0) url += "?";
    if(courses.length > 0 || emptyCourses.length > 0) url += "courses=" + encodeURIComponent(JSON.stringify(cDict)) + "&";
    if(emptyCourses.length > 0) url += "emptycourses=" + encodeURIComponent(JSON.stringify(ecDict));

    history.pushState(null, '', url);
}

function checkOverlap(t, name){
    for(let i =0; i<courses.length; i++){
        for(let x =0; x<t.length; x++){
            for(let y =0; y<courses[i]["times"].length; y++){
                if(t[x]["day"] == courses[i]["times"][y]["day"]){
                    let s1 = t[x]["start"].split(":", 2);
                    let s2 = courses[i]["times"][y]["start"].split(":", 2);

                    let e1 = t[x]["end"].split(":", 2);
                    let e2 = courses[i]["times"][y]["end"].split(":", 2);

                    let time1 = toMinutes(s1);
                    let time2 = toMinutes(s2);
                    let h1 = toMinutes(e1) - time1;
                    let h2 = toMinutes(e2) - time2;

                    if(time1 < time2 + h2 && h1 + time1 > time2) {
                        document.getElementById("errormsg").innerHTML = "Course \"" + name + "\" overlaps with \"" + courses[i]["name"] + "\".";
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

//var lastC = null;

function add(cID = null, sec = null){
    var courseID = cID;
    var section = sec;
    if(cID == null && sec == null) {
        courseID = document.getElementById("coursecode").value.trim().toUpperCase();
        section = document.getElementById("section").value.trim();
    }
    section = "0".repeat(5-section.length) + section;

    //console.log(courseID + " : " + section);
    //lastC = courseID;

    if(courseDict == null) {
        document.getElementById("errormsg").innerHTML = "Courses dictionary not loaded?";
        //console.log("inv course dict");
        return false;
    }

    if(courseDict[courseID] == null){
        document.getElementById("errormsg").innerHTML = "Invalid Course Code.";
        //console.log("inv code");
        return false;
    }

    if(courseDict[courseID][section] == null){
        document.getElementById("errormsg").innerHTML = "Invalid Section ID.";
        //console.log("invalid id");
        return false;
    }

    for(let i = 0; i<courses.length; i++){
        if(courses[i]["id"] == courseID && courses[i]["section"] == section){
            document.getElementById("errormsg").innerHTML = "Course has already been added.";
            //console.log("already added");
            return false;
        }
    }
    for(let i = 0; i<emptyCourses.length; i++){
        if(emptyCourses[i]["CourseID"] == courseID && emptyCourses[i]["Section"] == section){
            document.getElementById("errormsg").innerHTML = "Course has already been added.";
            //console.log("already added");
            return false;
        }
    }

    var days = courseDict[courseID][section]["Day"];
    var hours = courseDict[courseID][section]["Time"];

    var t = [];

    let isEmpty = false;

    var c = "";
    if(courseDict[courseID][section]["More Info"] != ""){
        c = courseDict[courseID][section]["More Info"];
    }

    if(days.length != 0){
        for(let i = 0; i < days.length; i++){
            var a = [];
            try{
                a = hours[i].split("-", 2);
            }catch(err){
                emptyCourses.push({
                    name: courseDict[courseID][section]["Title"],
                    CourseID: courseID,
                    Section: section,
                    MoreInfo: c
                });
                isEmpty = true;
                break;
            }
            t.push({
                day: dateFetch(days[i]),
                start: a[0],
                end: a[1]
            });
        }
    }else{
        emptyCourses.push({
            name: courseDict[courseID][section]["Title"],
            CourseID: courseID,
            Section: section,
            MoreInfo: c
        });
        isEmpty = true;
    }

    if(checkOverlap(t, courseDict[courseID][section]["Title"])) return false;

    if(!isEmpty){
        courses.push({
            name: courseDict[courseID][section]["Title"],
            id: courseID,
            section: section,
            other: courseDict[courseID][section]["Teacher"],
            comment: c != "" ? "<a href=\"" + c + "\" TARGET=\"_blan\">More Info</A>" : "",
            color: "#efefef",
            times: t
        });
    }

    refresh();

    document.getElementById("errormsg").innerHTML = "";
    document.getElementById("section").value = "";
    document.getElementById("coursecode").value = "";
    return true;
}

function refresh(real = true){

    timetable = new Timetable( '#timetable', {
        timelapse:  {
          start:  08,
          end:    19
        },
        events: courses
    });

    if(emptyCourses.length > 0){
        if(emptyCourses[0]["MoreInfo"] != "")
            document.getElementById("info").innerHTML = "<a href=\"" + emptyCourses[0]["MoreInfo"] + "\" TARGET=\"_blan\">" + emptyCourses[0]["CourseID"] + "_" + emptyCourses[0]["Section"] + "</a>";
        else
            document.getElementById("info").innerHTML = emptyCourses[0]["CourseID"] + "_" + emptyCourses[0]["Section"];

        for(let i = 1; i<emptyCourses.length ; i++){
            if(emptyCourses[i]["MoreInfo"] != "")
                document.getElementById("info").innerHTML += ", <a href=\"" + emptyCourses[i]["MoreInfo"] + "\" TARGET=\"_blan\">" + emptyCourses[i]["CourseID"] + "_" + emptyCourses[i]["Section"] + "</a>";
            else
                document.getElementById("info").innerHTML += ", " + emptyCourses[i]["CourseID"] + "_" + emptyCourses[i]["Section"];
        }
        if(emptyCourses.length > 1){
            document.getElementById("info").innerHTML += " have no dates & hours.";
        }else{
            document.getElementById("info").innerHTML += " has no dates & hours.";
        }
    }else {
        document.getElementById("info").innerHTML = "";
    }

    if(real){

        var closelist = document.getElementById("deletelist");
        closelist.innerHTML = "";

        for(let i = 0; i < courses.length; i++){
            closelist.innerHTML += "<li e=\"0\" code=\"" + courses[i]["id"] + "\" sect=\"" + courses[i]["section"] + "\">" + courses[i]["name"] + "<span class=\"close\">&times;</span></li>";
        }

        for(let i = 0; i < emptyCourses.length; i++){
            closelist.innerHTML += "<li e=\"1\" code=\"" + emptyCourses[i]["CourseID"] + "\" sect=\"" + emptyCourses[i]["Section"] + "\">" + emptyCourses[i]["name"] + "<span class=\"close\">&times;</span></li>";
        }
        refreshDeleteElements();
    }
    updateURL();
}

function refreshDeleteElements(){
    var closebtns = document.getElementsByClassName("close");
    for (let i = 0; i < closebtns.length; i++) {
        closebtns[i].addEventListener("click", function() {
            var code = this.parentElement.getAttribute("code");
            var sect = this.parentElement.getAttribute("sect");
            var empty = this.parentElement.getAttribute("e");
            var which = -1;
            if(empty == "0"){
                for(let i=0; i<courses.length; i++){
                    if(courses[i]["id"] == code && courses[i]["section"] == sect) which = i;
                }
                if(which != -1) courses.splice(which, 1);
            }else{
                for(let i=0; i<emptyCourses.length; i++){
                    if(emptyCourses[i]["CourseID"] == code && emptyCourses[i]["Section"] == sect) which = i;
                }
                if(which != -1) emptyCourses.splice(which, 1);
            }
            document.getElementById("timetable").innerHTML = "";
            refresh(false);
            this.parentElement.style.display = 'none';
        });
    }
}

function dateFetch(s){
    switch(s){
        case "Mon":
            return 0;
        case "Tue":
            return 1;
        case "Wed":
            return 2;
        case "Thu":
            return 3;
        case "Fri":
            return 4;
        default:
            document.getElementById("errormsg").innerHTML = "Report this, Invalid date: " + s;
    }
    return -1;
}

function reset(){
    courses = [];
    emptyCourses = [];
    document.getElementById("timetable").innerHTML = "";
    document.getElementById("deletelist").innerHTML = "";
    document.getElementById("errormsg").innerHTML = "";
    document.getElementById("info").innerHTML = "";
    timetable = new Timetable( '#timetable', {
        timelapse:  {
          start:  08,
          end:    19
        },
        events: []
    });
    updateURL();
}