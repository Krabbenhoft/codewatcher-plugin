import json
TAB_WIDTH = "    "
raw_text = open("input.txt", "r").read()
parsed_text = raw_text.replace("    }\n    {\n    ", "    },\n    {\n    ")
open("./output.json",  "w").write(parsed_text)
json_data_string = open("./output.json", "r").read()
json_data = json.loads(json_data_string)
# print(str(json_data))

all_enrollments = []
for curr_json_object in json_data:
    all_enrollments.append(curr_json_object["user_enrollment"])

non_users = len(open("nonusers", "r").read().split())
unique_enrollements = set(all_enrollments)
total_users = len(unique_enrollements) - non_users
print("Total users: " + str(total_users))
