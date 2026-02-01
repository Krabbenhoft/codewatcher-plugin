docker exec -i mongodb_container mongosh -u admin -p admin123 <<EOF
use llmextension
db["interaction_logs "].find().pretty()
EOF
