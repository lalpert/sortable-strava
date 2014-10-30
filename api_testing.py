import urllib2
import json

def get(url):
    try:
        #auth_dict = {"Authorization" : "Bearer 82bdd33b624ea3c910f4a565edcf70a503f48c02"}
        request = urllib2.Request(url) #, headers=auth_dict)
        response = urllib2.urlopen(request).read()
        return json.loads(response)
    except:
        print "ERROR LOADING", url
        return None

url = "http://www.strava.com/api/v3/segment_efforts/5038720510?access_token=82bdd33b624ea3c910f4a565edcf70a503f48c02"
print get(url)
