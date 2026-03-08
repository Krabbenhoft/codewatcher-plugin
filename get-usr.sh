#!/bin/bash

create_user () {
  curl -s -X 'POST' \
    'http://127.0.0.1:8083/user' \
    -H 'accept: application/json' \
    -H 'Content-Type: application/json' \
    -d "{
    \"name\": \"$RANDOM\",
    \"email\": \"$RANDOM\",
    \"password\": \"string\",
    \"gender\": \"$RANDOM\",
    \"ethnicity\": \"$RANDOM\",
    \"age\": $RANDOM
  }" > temp_file.txt

  #echo "The password is \"string\""

  enrollement=$(grep -o '[0-9].*\"' temp_file.txt)
  enrollement=${enrollement::-1}
  #echo "The enrollment is $enrollement"

  curl -s -X 'POST' \
    'http://127.0.0.1:8083/login' \
    -H 'accept: application/json' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "grant_type=password&username=${enrollement}&password=string&scope=&client_id=string&client_secret=string" > temp_file.txt

  token=$(grep -o '":".*","' temp_file.txt)
  token=${token:3}
  token=${token::-3}
  #echo "The token is $token"

  echo "$enrollement"

}

#Remove old output
rm -f users_out.txt

#Generate new ouput
for ((i=0; i < 60; i++)) do
  curr_enrollement=$(create_user)
  echo "$curr_enrollement" >> users_out.txt
done