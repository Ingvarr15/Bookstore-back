# Node

1. Download this repo and install dependencies by using "npm i".
2. Make sure that you have Postman and PostgreSQL. Create database with name "mydb", login "postgres" and password "postgres"
3. Start server with "npm start".
4. Create script in Postman on method POST (address http://localhost:*PORT*/api/auth/signin/ (P.S.: Defaul *PORT* is 8080)) to take token automatically with the following code:
---
   var jsonData = JSON.parse(responseBody);
   postman.setEnvironmentVariable("accessToken", jsonData.accessToken);
---
5. Put token variable in Getting user info, Editing user and Deleting user requests headers with key x-access-token and value {{accessToken}}.
6. Use Postman to send requests:
  - POST http://localhost:*PORT*/api/auth/signup/ with fields "username", "email", "password", "dob" (date of birth in YYYY-DD-MM format) for registration,
  - POST http://localhost:*PORT*/api/auth/signin/ for authorization,
  - GET http://localhost:*PORT*/api/personal/ for get user info,
  - PATCH http://localhost:*PORT*/api/personal/ with "email", "username", "password" or "dob" x-www-form-urlencoded field (WARNING: choose something one!),
  - DELETE http://localhost:*PORT*/api/personal/ for deleting user.
