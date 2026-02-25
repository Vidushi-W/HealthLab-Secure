# Get Admin Token for Postman

Admin credentials (from seed):
- **Email:** `admin@healthlab.com`
- **Password:** `admin123`

## Step 1: Get the token

**Option A – Postman**

1. Create a request: **POST** `http://localhost:5000/api/auth/login`
2. **Body** → raw → **JSON**
3. Body:
   ```json
   {
     "email": "admin@healthlab.com",
     "password": "admin123"
   }
   ```
4. Send the request.
5. In the response, copy the value of **`token`** (long string).

**Option B – Terminal (curl)**

```bash
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@healthlab.com\",\"password\":\"admin123\"}"
```

Copy the `token` value from the JSON response.

---

## Step 2: Use the token in Postman

For **every admin request** (and any other protected route):

1. Open the request.
2. Go to the **Authorization** tab.
3. **Type:** choose **Bearer Token**.
4. **Token:** paste the token you copied (no `Bearer ` prefix; Postman adds it).

**Or** set a collection variable:

1. In your collection, **Variables** tab: add variable `token`, value = (paste token).
2. In **Authorization** for the collection: Type **Bearer Token**, Token = `{{token}}`.
3. All requests in that collection will send the token.

---

## Summary

| Item        | Value                    |
|------------|---------------------------|
| Login URL  | `POST /api/auth/login`    |
| Email      | `admin@healthlab.com`    |
| Password   | `admin123`               |
| Header     | `Authorization: Bearer <token>` |

Tokens expire (see `JWT_EXPIRES_IN` in backend). If you get **401 Unauthorized** again, log in once more and replace the token in Postman.
