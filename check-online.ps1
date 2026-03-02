$base_users = docker exec mongodb_container mongosh -u admin -p admin123 --eval "use('llmextension'); db['user'].find().pretty()"
$length = $base_users.Length
$length
$r = Get-Random; Invoke-RestMethod -Uri 'http://127.0.0.1:8083/user' -Method Post -ContentType 'application/json' -Body (@{name="$r";email="$(Get-Random)";password="string";gender="$(Get-Random)";ethnicity="$(Get-Random)";age=(Get-Random -Maximum 65536)} | ConvertTo-Json)
$base_users_two = docker exec mongodb_container mongosh -u admin -p admin123 --eval "use('llmextension'); db['user'].find().pretty()"
$length_two = $base_users_two.Length

if ($length -eq $length_two)
{
    "Error"
}
else
{
    "Connected"
}