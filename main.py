import urllib2
import json

def get(url):
    try:
        auth_dict = {"Authorization" : "Bearer 82bdd33b624ea3c910f4a565edcf70a503f48c02"}
        request = urllib2.Request(url, headers=auth_dict)
        response = urllib2.urlopen(request).read()
        return json.loads(response)
    except:
        print "ERROR LOADING", url
        return None


base_url = "http://www.strava.com/api/v3/"
activity_url = base_url + "activities/"
all_activities_url = base_url + "athlete/activities/"
athlete_url = base_url + "athlete/"

athlete = get(athlete_url)
athlete_id = athlete["id"]



activity_num = 213350266
url = activity_url + str(activity_num) + "?include_all_efforts=1"
print "URL", url

activity = get(url)


segments = activity["segment_efforts"]
print "\n", len(segments)
for seg in segments:
    print seg["name"], seg["kom_rank"]

print "\n"

all_segments = []

# Get ahtlete's rank in each segment
for seg in segments:
    print seg["name"]

    # testing 123
    seg_effort_id = seg["id"]
    seg_effort_url = base_url + "segment_efforts/" + str(seg_effort_id)
    print seg_effort_url 
    results = get(seg_effort_url)
    print results["elapsed_time"]


    segment_id = seg["segment"]["id"]
    # This will return the top result, plus the current athlete's results and some surrounding results
    segment_url = base_url + "segments/%d/leaderboard?per_page=1&page=1&gender=F" % segment_id
    print segment_url
    results = get(segment_url)

    if not results:
        seg["time_ratio"] = None
        continue

    entry_count = results["entry_count"]
    fastest_time = results["entries"][0]["elapsed_time"]
    for e in results["entries"]:
        if e["athlete_id"] == athlete_id:
            rank = e["rank"]
            time = e["elapsed_time"]
  
    seg["rank"] = rank
    seg["percentile"] = rank * 1.0 / entry_count
    seg["entry_count"] = entry_count
    seg["time_ratio"] = time * 1.0 / fastest_time 
    #seg["effort_id"] = results["effort_id"]

segments.sort(key=lambda seg: seg["time_ratio"])
for seg in segments:
    try:
        print seg["percentile"], seg["time_ratio"], seg["rank"], seg["entry_count"], seg["name"]
    except:
        print  seg["name"], "No data"

