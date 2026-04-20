-- First, delete the incorrectly inserted users
DELETE FROM public.users WHERE email IN ('brucestudent@gmail.com', 'bruceadmin@gmail.com');

-- The passwords will be hashed automatically when you use the register API endpoint
-- Use the following curl commands or Postman to register users:

-- Register Student:
-- POST http://localhost:3000/api/auth/register
-- Body: 
-- {
--   "username": "bruce",
--   "email": "brucestudent@gmail.com",
--   "password": "brucestudent",
--   "role": "student"
-- }

-- Register Admin:
-- POST http://localhost:3000/api/auth/register
-- Body:
-- {
--   "username": "bruceadmin",
--   "email": "bruceadmin@gmail.com",
--   "password": "bruceadmin",
--   "role": "admin"
-- }
