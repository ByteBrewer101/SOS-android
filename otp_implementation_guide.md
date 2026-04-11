# Full-Stack Email OTP Verification Guide

This guide provides a complete, production-aware implementation for email-based OTP verification using a Node.js (Express) backend and a native Android (Kotlin) frontend.

## 1. Backend Implementation (Node.js + Express)

We'll use an in-memory store for OTPs for simplicity, but in a production environment, you should use **Redis** or a Database with TTL (Time-To-Live). We will hash the OTPs using `bcrypt` before storing them, generate a `JWT` upon successful verification, and implement rate limiting.

### 1.1 Project Setup & Environment

First, initialize your project and install the dependencies.
```bash
npm init -y
npm install express nodemailer bcrypt jsonwebtoken express-rate-limit dotenv cors
```

**`.env` file** (Example)
```env
PORT=3000
EMAIL_USER=your_gmail@gmail.com
# Use an App Password if using Gmail, not your actual account password
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=super_secret_jwt_key_123
JWT_EXPIRES_IN=7d
```

### 1.2 Backend Folder Structure

```text
/backend
 ├── /controllers
 │   └── auth.controller.js
 ├── /routes
 │   └── auth.routes.js
 ├── /services
 │   └── email.service.js
 ├── /utils
 │   └── otp.util.js
 ├── .env
 └── server.js
```

### 1.3 `utils/otp.util.js` (Generate OTP)

```javascript
// Generates a 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

### 1.4 `services/email.service.js` (Nodemailer Setup)

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Login OTP',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Authentication OTP</h2>
                <p>Your One-Time Password for verification is:</p>
                <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
                <p>This code will expire in <strong>5 minutes</strong>. Do not share it with anyone.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};
```

### 1.5 `controllers/auth.controller.js` (Core Logic)

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp.util');
const { sendOTPEmail } = require('../services/email.service');

// In-memory store for OTPs. Production: Use Redis or DB.
// Data format: { email: { otpHash, expiresAt } }
const otpStore = new Map();

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        // 1. Generate 6-digit OTP
        const otp = generateOTP();

        // 2. Hash the OTP for secure storage
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // 3. Store hashed OTP with 5-minute expiration
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins in MS
        otpStore.set(email, { otpHash, expiresAt });

        // 4. Send the email via Nodemailer
        await sendOTPEmail(email, otp);

        // NOTE: NEVER return the raw OTP in the success response!
        res.status(200).json({ message: "OTP sent successfully. Please check your email." });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

        // 1. Check if OTP exists for this email
        const storedData = otpStore.get(email);
        if (!storedData) {
            return res.status(400).json({ error: "Invalid OTP or session expired" });
        }

        // 2. Check if OTP has expired
        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email); // Clean up expired OTP
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // 3. Verify OTP using bcrypt
        const isValid = await bcrypt.compare(otp.toString(), storedData.otpHash);
        if (!isValid) {
            return res.status(400).json({ error: "Invalid OTP entered." });
        }

        // 4. Verification successful, generate JWT
        otpStore.delete(email); // Clean up after success

        const token = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(200).json({
            message: "Verification successful",
            token: token
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
};
```

### 1.6 `routes/auth.routes.js` & `server.js`

**`routes/auth.routes.js`**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting for OTP generation to prevent spam
const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 OTP requests per minute
    message: { error: "Too many requests. Please wait before trying again." }
});

router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
```

**`server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

## 2. Android App (Java/Kotlin)

We will use **Kotlin** with **Retrofit** for network calls and **Coroutines** for asynchronous logic.

### 2.1 Dependencies (`build.gradle`)
Add these inside `dependencies`:
```groovy
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4'
```
*Don't forget to add internet permissions in `AndroidManifest.xml`: `<uses-permission android:name="android.permission.INTERNET" />`*

### 2.2 Retrofit Setup

**`ApiService.kt`**
```kotlin
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class SendOtpRequest(val email: String)
data class VerifyOtpRequest(val email: String, val otp: String)
data class BaseResponse(val message: String?, val error: String?, val token: String?)

interface ApiService {
    @POST("/api/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<BaseResponse>

    @POST("/api/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<BaseResponse>
}
```

**`RetrofitClient.kt`**
```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // 10.0.2.2 is used by Android Emulator to reach localhost on your PC
    private const val BASE_URL = "http://10.0.2.2:3000/" 

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
```

### 2.3 Send OTP Screen (`SendOtpActivity.kt`)
This handles inputting the email and invoking the Send OTP API.
```kotlin
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SendOtpActivity : AppCompatActivity() {

    private lateinit var emailInput: EditText
    private lateinit var btnSendOtp: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_send_otp)

        emailInput = findViewById(R.id.et_email)
        btnSendOtp = findViewById(R.id.btn_send_otp)
        progressBar = findViewById(R.id.progress_bar)

        btnSendOtp.setOnClickListener {
            val email = emailInput.text.toString().trim()
            if (email.isEmpty()) {
                Toast.makeText(this, "Enter an email", Toast.show).show()
                return@setOnClickListener
            }
            sendOtpCall(email)
        }
    }

    private fun sendOtpCall(email: String) {
        progressBar.visibility = View.VISIBLE
        btnSendOtp.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.apiService.sendOtp(SendOtpRequest(email))
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    btnSendOtp.isEnabled = true
                    
                    if (response.isSuccessful) {
                        Toast.makeText(this@SendOtpActivity, "OTP Sent!", Toast.LENGTH_SHORT).show()
                        // Navigate to Verify OTP
                        val intent = Intent(this@SendOtpActivity, VerifyOtpActivity::class.java)
                        intent.putExtra("EMAIL", email)
                        startActivity(intent)
                    } else {
                        Toast.makeText(this@SendOtpActivity, "Failed to send OTP", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    btnSendOtp.isEnabled = true
                    Toast.makeText(this@SendOtpActivity, "Network Error", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
```

### 2.4 Verify OTP Screen (`VerifyOtpActivity.kt`)
Includes OTP verification and a 30-second resend timer!

```kotlin
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class VerifyOtpActivity : AppCompatActivity() {

    private lateinit var otpInput: EditText
    private lateinit var btnVerify: Button
    private lateinit var tvResendTimer: TextView
    private lateinit var btnResend: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var email: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_verify_otp)

        email = intent.getStringExtra("EMAIL") ?: ""

        otpInput = findViewById(R.id.et_otp)
        btnVerify = findViewById(R.id.btn_verify)
        tvResendTimer = findViewById(R.id.tv_resend_timer)
        btnResend = findViewById(R.id.btn_resend)
        progressBar = findViewById(R.id.progress_bar)

        startResendTimer()

        btnVerify.setOnClickListener {
            val otp = otpInput.text.toString().trim()
            if (otp.length != 6) {
                Toast.makeText(this, "Enter 6-digit OTP", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            verifyOtpCall(email, otp)
        }

        btnResend.setOnClickListener {
            startResendTimer()
            resendOtpCall(email)
        }
    }

    private fun startResendTimer() {
        btnResend.isEnabled = false
        btnResend.visibility = View.GONE
        tvResendTimer.visibility = View.VISIBLE

        object : CountDownTimer(30000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                tvResendTimer.text = "Resend OTP in ${millisUntilFinished / 1000}s"
            }
            override fun onFinish() {
                tvResendTimer.visibility = View.GONE
                btnResend.visibility = View.VISIBLE
                btnResend.isEnabled = true
            }
        }.start()
    }

    private fun verifyOtpCall(email: String, otp: String) {
        progressBar.visibility = View.VISIBLE
        btnVerify.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.apiService.verifyOtp(VerifyOtpRequest(email, otp))
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    btnVerify.isEnabled = true
                    
                    if (response.isSuccessful) {
                        val token = response.body()?.token
                        Toast.makeText(this@VerifyOtpActivity, "Success! Token: $token", Toast.LENGTH_LONG).show()
                        // TODO: Save JWT securely in EncryptedSharedPreferences and go to Home
                    } else {
                        Toast.makeText(this@VerifyOtpActivity, "Invalid or expired OTP", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    btnVerify.isEnabled = true
                    Toast.makeText(this@VerifyOtpActivity, "Network Error", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun resendOtpCall(email: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                RetrofitClient.apiService.sendOtp(SendOtpRequest(email))
            } catch (e: Exception) {
                // Ignore silent network failure on resend
            }
        }
    }
}
```

---

## 3. Step-by-step Expected Flow

1. **User requests OTP:** The user opens the Android app, enters their email on `SendOtpActivity`, and hits **Send**.
2. **Backend receives the request:** The `sendOtp` handler generates a 6-digit number.
3. **Backend secures it:** The OTP is hashed using `bcrypt` and stored in memory with an expiration wrapper (`expiresAt`).
4. **Email dispatched:** Node uses Nodemailer and an App Password to dispatch an email beautifully formatted with HTML to the user.
5. **App transitions:** `SendOtpActivity` gets a success HTTP 200 via Retrofit. It routes the user to `VerifyOtpActivity` passing the email as an `Intent` extra. The 30s timer starts.
6. **User types OTP:** The user checks their email, gets the code, and types it into the app.
7. **Backend validation:** Node retrieves the hashed OTP memory block. It verifies it hasn't expired, then runs `bcrypt.compare` to check if the incoming code matches.
8. **App authenticated:** Node responds with an HTTP 200 carrying the Signed JWT. The App captures the token to be saved locally for authenticated API calls.

---

## 4. Testing with Postman

**A) Test `send-otp`:**
1. Method: `POST` / URL: `http://localhost:3000/api/send-otp`
2. Headers: `Content-Type: application/json`
3. Body: `{"email": "your_test_email@gmail.com"}`
4. Send. Observe the 200 response, and wait for the email.

**B) Test `verify-otp` (Success):**
1. Note the 6-digit OTP from your email.
2. Method: `POST` / URL: `http://localhost:3000/api/verify-otp`
3. Body: `{"email": "your_test_email@gmail.com", "otp": "xxxxxx"}`
4. Send. You should receive `{"message": "Verification successful", "token": "ey..."}`.

**C) Test Variables (Fail Cases):**
1. Resend the exact same `verify-otp` request immediately. You'll get `"Invalid OTP or session expired"` because it was cleaned up after success.
2. Formulate a request with a wrong OTP (`111111`). You'll get `"Invalid OTP entered"`.
3. Send 4 `send-otp` requests rapidly. The 4th will invoke the Rate Limiting error due to the 3-requests-per-min max.
