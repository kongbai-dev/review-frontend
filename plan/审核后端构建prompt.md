接下来我需要你做的是为审核前端的登录界面构建一个简易的登录用后端

request: 

1. 因为该审核前端是内部使用,因此只要有固定账号表就可以

2. 用户表至少保留字段

   ```
   id
   username
   password_hash
   name
   role
   status
   created_at
   ```

3. 登录接口:

   ```
   POST /auth/login
   GET /auth/me
   POST /auth/logout
   ```

4. JWT token:登录成功后后端返回token,前端后面请求接口时带上

5. 权限字段: 登录时账号的权限由后端提供

   ```
   admin
   reviewer
   observer
   ```

6. 审核操作日志:
   - 谁审核的
   - 审了哪条
   - 改了什么
   - 什么时间改的

postgreSOL构建

