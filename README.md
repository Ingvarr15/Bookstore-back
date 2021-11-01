# Node

1. Download this repo and install dependencies by using "npm i" in terminal in the root folder of project.
2. Make sure that you have PostgreSQL. Create database with name "mydb" (some of config variables are located in .env file. You can ask me to send it to you or create your own: 
PORT = *port for your server*
SECRET = *'key-word for passwords and tokens'*
DB_USERNAME = *username of your database*
DB_PASSWORD = *password of your database*
DB_HOST = localhost)
3. For first launch of project, you must use command "npx sequelize-cli db:seed:all" in terminal to create roles for users.
4. Start server with "npm start".
   P.S.: This server are using by front-side of "Bookstore" project. Current link - https://github.com/Ingvarr15/Bookstore-front
5. By default every new user gets role "Admin". You can change it in "controllers/auth.controller.js" at line 31 in "user.setRole([2])" (2 is for Admin and 1 is for User).
