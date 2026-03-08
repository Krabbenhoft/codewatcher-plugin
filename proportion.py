import json
from datetime import datetime

def isStart(json_frame):
    return json_frame['changes'][0]['type'] == "focus"

def getTime(json_frame):
    return datetime.fromisoformat(json_frame['changes'][0]['time'])

data = open("sampledata.json", "r").read()
json_data = json.loads(data)

print(len(json_data))

wanted_user = "202610f880b3"

wanted_json = [json_event for json_event in json_data if
               ((json_event['user_enrollment'] == wanted_user) and 
               ((json_event['changes'][0]['type'] == "focus") or (json_event['changes'][0]['type'] == "unfocus")))]
print(len(wanted_json))

time_focus = 0
json_stack = wanted_json.copy()
current_frame = None
current_start_frame = None
while not len(json_stack) == 0:
    current_frame = json_stack.pop(0)

    #If you have a beggining and have found an end, add the time difference
    if current_start_frame and not isStart(current_frame):
        total_time_start = getTime(current_start_frame)
        total_time_end = getTime(current_frame)
        time_focus += (total_time_end - total_time_start ).total_seconds()
        current_start_frame = None
        print("getting end frame time focuss increased " + str((total_time_start - total_time_end).total_seconds()) )
    #If you need a start frame, and this is a start frame, take this json object
    elif current_start_frame == None and isStart(current_frame):
        current_start_frame = current_frame
        print("getting start frame")
    #Otherwise the current frame is a start frame after a start frame and not needed
    #Or it is an end frame after an end frame and not needed, discard the frame



total_time_start = datetime.fromisoformat(wanted_json[0]['changes'][0]['time'])
total_time_end = datetime.fromisoformat(wanted_json[len(wanted_json) - 1]['changes'][0]['time'])
total_time = (total_time_end - total_time_start).total_seconds()
print("Total time: " + str(total_time))
print("Focus time: " + str(time_focus))
print("Proportion focused: " + str(float(time_focus / total_time)))
