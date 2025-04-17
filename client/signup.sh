curl -X 'POST' \                                                    
  'http://localhost:8000/signup' \  
  -H 'Content-Type: application/json' \
  -d '{                              
  "username": "testuser",
  "password": "testpass"
}'