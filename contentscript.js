baseUrl = "https://www.strava.com/api/v3/";
access = "access_token=" + api_token; // api_token is set in passwords.js

pctBackString = "Percent slower than leader";


// Find elements with a specific data- attribute
filterByData = function(element, attr) {
    return jQuery(element).filter(
        function() { return jQuery(this).data(attr) != undefined; }
    );
}

// Convenience method to do a GET 
// TODO: add auth headers
get = function(url) {
    return jQuery.ajax({
        url: url,
        dataType: 'json',
    });
}

// Ajax: Gets athlete data. We need athlete's ID eventually.
getAthlete = function() {
    athleteUrl = baseUrl + "athlete?" + access;
    return get(athleteUrl);
}

// Ajax: Gets segment effort data based on a segment effort ID
// Returns data including segment ID.
getSegmentEffortData = function(segmentEffortId) {
    segmentEffortUrl = baseUrl + "segment_efforts/" + segmentEffortId + "?" + access;
    return get(segmentEffortUrl);
}

// Ajax: Gets segment leaderboard from segment ID
// Returns data including athlete's performance on segment
getSegmentLeaderboardData = function(segmentId) {
    segmentUrl = baseUrl + "segments/" + segmentId + "/leaderboard?per_page=1&page=1&gender=F&" + access; 
    return get(segmentUrl);
}

// Get the athlete's performance from the leaderboard 
getMyRow = function(athleteId, leaderboardEntries) {
    return _.findWhere(leaderboardEntries, {athlete_id: athleteId});
}

formatRank = function(rank, entryCount) { 
    return rank + "/" + entryCount;
}

// Puts the given string into the specified place in the table
replaceEntry = function(colName, row, string) {
    entry = row.children[colNumDict[colName]];
    jQuery(entry).text(string);
}

// Change the table headers to reflect new columns
replaceHeaders = function() {
    t = jQuery(".segments");
    headers = jQuery(t).find('th');

    // Replace VAM with Rank
    vam = headers[colNumDict["Rank"] - 1]; // Headers are off by 1 from the rest of the table
    jQuery(vam).text("Rank");

    // Replace HR with percent back from leader
    hr = headers[colNumDict[pctBackString] - 1];
    jQuery(hr).text(pctBackString);
    jQuery(hr).width("200px");

    // When you click a th, sort the table by that column
    jQuery("th").click(sortByColumn);
}

/* The following functions take a string and return a number to sort by
 */
rankFromString = function(string) {
    rankString = string.split("/")[0]
    num = -1 * parseInt(rankString); // Want smallest to biggest
    return isNaN(num) ? Number.MIN_VALUE : num;
}

// TODO: make it work for times <1 minute
timeFromString = function(string) {
    time = string.split(":")
    return parseInt(time[0]) * 60 + parseInt(time[1]);
}

speedFromString = function(string) {
    speedString = string.split("m");
    return parseFloat(speedString[0]);
}

powerFromString = function(string) { 
    power = string.split("W")
    return parseInt(power[0]);
}

nameFromString = function(string) { 
    return string.split("\n")[0];
}

percentFromString = function(string) { 
    percent = string.split("%");
    num =  -1 * parseInt(percent[0]);
    return isNaN(num) ? Number.MIN_VALUE : num;
}

// Maps column to parsing function
processStringDict = {
    "Name": nameFromString,
    "Time": timeFromString,
    "Speed": speedFromString,
    "Power": powerFromString,
    "Rank": rankFromString,
    "Percent slower than leader": percentFromString
};

// Maps column name to column number
colNumDict = {
    "Name": 2,
    "Time": 4,
    "Speed": 5,
    "Power": 6,
    "Rank": 7,
    "Percent slower than leader": 8
};

stringComparison = function(a, b) {
    console.log("comparing", a, b);
  if (a < b) {
      return -1;
  } else if (b < a) {
      return 1;
  } else {
      return 0;
  }
}

comparisonFuncDict = {
    "default": function(a,b) {return b - a},
    "Name": stringComparison
};

// Given a row and the column number, returns the text from that column header,
// such as 12:00
stringFromRow = function(row, tdNum) {
    td = jQuery(row).children()[tdNum];
    return jQuery(td).text().trim();
}

// Takes in a clicked header, and sorts by that header's column
sortByColumn = function(e) {
    th = this;
    colName = jQuery(th).text().trim();
    processStringFunc = processStringDict[colName];
    comparisonFunc = colName in comparisonFuncDict ? 
        comparisonFuncDict[colName] : comparisonFuncDict["default"];
    console.log("comparison func:", comparisonFunc);
    tdNum = colNumDict[colName];
    rows = filterByData('tr', 'segment-effort-id').get();
   
    rows.sort(function(rowA, rowB) {
        stringA = stringFromRow(rowA, tdNum);
        stringB = stringFromRow(rowB, tdNum);
        // Sort biggest to smallest
        return comparisonFunc(processStringFunc(stringA), processStringFunc(stringB));
    });

    console.log(rows);

    jQuery.each(rows, function(index, row) {
        jQuery(".segments").children('tbody').append(row);
    });
}

// Get data and update row for the given table row
replaceData = function(row) {
    segmentEffortId = jQuery(row).data('segment-effort-id');
    console.log("Starting segment ", segmentEffortId);

    // Get segment effort data
    deferredSegmentEffort = getSegmentEffortData(segmentEffortId);

    // Once we have segment effort data, get segment leaderboard data
    deferredLeaderboardData = deferredSegmentEffort.then(function(segmentEffortData) {
        segmentId = segmentEffortData.segment.id;
        return getSegmentLeaderboardData(segmentId);
    });

    // Once we have leaderboard data and athlete data, look up and replace data
    jQuery.when(deferredAthlete, deferredLeaderboardData).done(function(athleteData, leaderboardData){

        entries = leaderboardData[0].entries;
        myRow = getMyRow(athleteData[0].id, entries)

        // Replace VAM column with rank
        entryCount = leaderboardData[0].entry_count;
        rankString = formatRank(myRow.rank, entryCount);
        replaceEntry("Rank", row, rankString);

        // Replace HR column with % back from 1st
        fastestTime = entries[0].elapsed_time;
        myTime = myRow.elapsed_time;
        percentBack = Math.round((myTime / fastestTime - 1) * 100) + "%";
        replaceEntry(pctBackString, row, percentBack);
    });
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getParamFromUrl(paramName) {
    var queryString = window.location.search.substring(1);
    // Split into key/value pairs
    var queries = queryString.split("&");
    var params = {};
    // Convert the array of strings into an object
    for (var i = 0; i < queries.length; i++) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }

    return params[paramName];

}

authorizeUser = function() {
    currentUrl = window.location.href;
    authUrl = "https://www.strava.com/oauth/authorize?response_type=code&client_id=3244&redirect_uri=" + currentUrl;
    window.location.href = authUrl;
    getParamFromUrl("code")

}

main = function() {
    // First of all, authorize the user...
    // TODO: make this work
    //authorizeUser();
    //return;

    // Change the table headers to reflect what will soon be there
    replaceHeaders();

    // Query for athlete data to get athlete's ID
    deferredAthlete = getAthlete();

    // Get data and update row for each segment in the table
    rows = filterByData('tr', 'segment-effort-id')
    _.each(rows, replaceData);
}

console.log("Starting the script");
main();
