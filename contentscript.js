baseUrl = "https://www.strava.com/api/v3/";
token = "redacted"
token = access = "access_token=" + token;

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

// Ajax: Gets segment leaderboard.
// Needs segment ID
// Returns data including athlete's performance on segment
getSegmentLeaderboardData = function(segmentId) {
    segmentUrl = baseUrl + "segments/" + segmentId + "/leaderboard?per_page=1&page=1&gender=F&" + access; 
    return get(segmentUrl);
}

// Gets athlete's rank
getRankOnSegment = function(athleteId, leaderboardEntries) {
    myRow = _.findWhere(leaderboardEntries, {athlete_id: athleteId});
    return myRow.rank;
}

// Replaces the power column with rank information
replacePower = function(row, rank, entryCount) {
    powerTd = row.children[6];
    jQuery(powerTd).text(rank + "/" + entryCount);
}

// Change the table headers to reflect new columns
replaceHeaders = function() {
    //t = $(".segments");
    //console.log(t);
    t = jQuery(".segments");
    headers = jQuery(t).find('th');
    power = headers[5];
    jQuery(power).text("Rank");
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

    // Once we have leaderboard data and athlete data, look up segment rank.
    jQuery.when(deferredAthlete, deferredLeaderboardData).done(function(athleteData, leaderboardData){
        rank = getRankOnSegment(athleteData[0].id, leaderboardData[0].entries);
        entryCount = leaderboardData[0].entry_count;
        replacePower(row, rank, entryCount);
    });
}

main = function() {
    // Change the table headers to reflect what will soon be there
    replaceHeaders();

    // Query for athlete data to get athlete's ID
    deferredAthlete = getAthlete();

    // Get data and update row for each segment in the table
    rows = filterByData('tr', 'segment-effort-id')
    row = rows[0]
    _.each(rows, replaceData);
}

console.log("Starting the script");
main();
