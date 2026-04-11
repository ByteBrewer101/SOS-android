import os

def replace_in_file(path, replacements):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        for search, replace in replacements:
            content = content.replace(search, replace)
            
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {path}")
    except Exception as e:
        print(f"Failed {path}: {e}")

# Backend Models
be_models = 'backend/src/models'
replace_in_file(os.path.join(be_models, 'Elder.js'), [
    ('phone:', 'email:'),
    ('phoneVerified:', 'emailVerified:'),
    ('Phone number is required', 'Email is required'),
    ('match: [/^[6-9]\d{9}$/, \'Please enter a valid Indian phone number\']', 'match: [/^\\S+@\\S+\\.\\S+$/, \'Please enter a valid email address\']'),
    ('user.phone', 'user.email')
])

replace_in_file(os.path.join(be_models, 'Volunteer.js'), [
    ('phone:', 'email:'),
    ('phoneVerified:', 'emailVerified:'),
    ('Phone number is required', 'Email is required'),
    ('match: [/^[6-9]\d{9}$/, \'Please enter a valid Indian phone number\']', 'match: [/^\\S+@\\S+\\.\\S+$/, \'Please enter a valid email address\']')
])

replace_in_file(os.path.join(be_models, 'OTP.js'), [
    ('phone:', 'email:'),
    ("enum: ['phone', 'aadhaar']", "enum: ['email', 'aadhaar']"),
    ("phone: 1,", "email: 1,")
])

# Auth controller
replace_in_file('backend/src/controllers/authController.js', [
    ('const { name, phone, password', 'const { name, email, password'),
    ('Elder.findOne({ phone })', 'Elder.findOne({ email })'),
    ("'An account with this phone number already exists'", "'An account with this email already exists'"),
    ('\n        phone,\n', '\n        email,\n'),
    ('Volunteer.findOne({ phone })', 'Volunteer.findOne({ email })'),
    ("'Invalid phone number or password'", "'Invalid email or password'"),
    ('const { phone, password } = req.body;', 'const { email, password } = req.body;'),
    ('const { phone } = req.body;', 'const { email } = req.body;'),
    ('const { phone, otp } = req.body;', 'const { email, otp } = req.body;'),
    ('const result = await otpService.sendPhoneOTP(phone);', 'const result = await otpService.sendEmailOTP(email);'),
    ('const result = await otpService.verifyPhoneOTP(phone, otp);', 'const result = await otpService.verifyEmailOTP(email, otp);'),
    ('elder.phoneVerified = true;', 'elder.emailVerified = true;'),
    ('volunteer.phoneVerified = true;', 'volunteer.emailVerified = true;'),
    ("'Phone number verified successfully'", "'Email verified successfully'")
])

# Routes
replace_in_file('backend/src/routes/authRoutes.js', [
    ('- phone', '- email'),
    ('phone:', 'email:'),
    ('9876543210', 'user@example.com'),
    ('9876543212', 'vol@example.com')
])

# Validators
replace_in_file('backend/src/middlewares/validators.js', [
    ("body('phone')", "body('email')"),
    ("'Phone number is required'", "'Email address is required'"),
    (".matches(/^[6-9]\\d{9}$/)", ".isEmail()"),
    ("'Please enter a valid 10-digit Indian phone number'", "'Please enter a valid email address'")
])

# Frontend Login
replace_in_file('app/src/screens/LoginScreen.js', [
    ('const [phone, setPhone] = useState', 'const [email, setEmail] = useState'),
    ('phone.trim', 'email.trim'),
    ("!/^[6-9]\\d{9}$/.test(phone.trim())", "!/^\\S+@\\S+\\.\\S+$/.test(email.trim())"),
    ("'Invalid Phone'", "'Invalid Email'"),
    ("'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"),
    ('your phone number', 'your email address'),
    ('loginFn(phone.trim', 'loginFn(email.trim'),
    ('Phone Number', 'Email Address'),
    ('Enter phone number', 'Enter email address'),
    ('keyboardType="phone-pad"', 'keyboardType="email-address"'),
    ('maxLength={10}', ''),
    ('value={phone}', 'value={email}'),
    ('onChangeText={setPhone}', 'onChangeText={setEmail}'),
    ('<Text style={styles.prefix}>+91</Text>', '')
])

replace_in_file('app/src/screens/RegisterElderScreen.js', [
    ('const [phone, setPhone] = useState', 'const [email, setEmail] = useState'),
    ('phone.trim', 'email.trim'),
    ("!/^[6-9]\\d{9}$/.test(phone.trim())", "!/^\\S+@\\S+\\.\\S+$/.test(email.trim())"),
    ("'Invalid Phone'", "'Invalid Email'"),
    ("'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"),
    ('phone: phone.trim', 'email: email.trim'),
    ('Phone Number', 'Email Address'),
    ('Enter phone number', 'Enter email address'),
    ('value={phone}', 'value={email}'),
    ('onChangeText={setPhone}', 'onChangeText={setEmail}'),
    ('keyboardType="phone-pad"', 'keyboardType="email-address" autoCapitalize="none"'),
    ('prefix="+91"', ''),
    ('maxLength={10}', ''),
    ('!name.trim() || !phone.trim() || !password.trim() || !emergencyContactName.trim() || !emergencyContactNumber.trim()', '!name.trim() || !email.trim() || !password.trim() || !emergencyContactName.trim() || !emergencyContactNumber.trim()')
])

replace_in_file('app/src/screens/RegisterVolunteerScreen.js', [
    ('const [phone, setPhone] = useState', 'const [email, setEmail] = useState'),
    ('phone.trim', 'email.trim'),
    ("!/^[6-9]\\d{9}$/.test(phone.trim())", "!/^\\S+@\\S+\\.\\S+$/.test(email.trim())"),
    ("'Invalid Phone'", "'Invalid Email'"),
    ("'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"),
    ('phone: phone.trim', 'email: email.trim'),
    ('Phone Number', 'Email Address'),
    ('Enter phone number', 'Enter email address'),
    ('value={phone}', 'value={email}'),
    ('onChangeText={setPhone}', 'onChangeText={setEmail}'),
    ('keyboardType="phone-pad"', 'keyboardType="email-address" autoCapitalize="none"'),
    ('prefix="+91"', ''),
    ('maxLength={10}', ''),
    ('!name.trim() || !phone.trim() || !password.trim() || !aadhaarNumber.trim()', '!name.trim() || !email.trim() || !password.trim() || !aadhaarNumber.trim()')
])

replace_in_file('app/src/services/api.js', [
    ('export const loginElder = async (phone, password)', 'export const loginElder = async (email, password)'),
    ('body: JSON.stringify({ phone, password })', 'body: JSON.stringify({ email, password })'),
    ('export const loginVolunteer = async (phone, password)', 'export const loginVolunteer = async (email, password)'),
    ('export const sendOTP = async (phone)', 'export const sendOTP = async (email)'),
    ('body: JSON.stringify({ phone })', 'body: JSON.stringify({ email })'),
    ('export const verifyOTP = async (phone, otp)', 'export const verifyOTP = async (email, otp)'),
    ('body: JSON.stringify({ phone, otp })', 'body: JSON.stringify({ email, otp })')
])

replace_in_file('app/src/screens/ProfileScreen.js', [
    ('label="Phone Number"', 'label="Email Address"'),
    ('`+91 ${user?.phone || \'\'}`', 'user?.email || \'\'')
])

print("Python replace script done.")
