const fs = require('fs');
const path = require('path');

const BE_MODELS = ['Elder.js', 'Volunteer.js', 'OTP.js'];
const BE_MODELS_PATH = 'backend/src/models';

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

// 1. Models
replaceInFile(path.join(BE_MODELS_PATH, 'Elder.js'), [
    ['phone:', 'email:'],
    ['phoneVerified:', 'emailVerified:'],
    [/'Phone number is required'/g, "'Email is required'"],
    [/match: \\/\\[6-9\\]\\\\d\\{9\\}\\//g, "match: /^\\\\S+@\\\\S+\\\\.\\\\S+$/"],
    [/'Please enter a valid Indian phone number'/g, "'Please enter a valid email address'"],
    ['user\\.phone', 'user.email'] // Just in case
]);

replaceInFile(path.join(BE_MODELS_PATH, 'Volunteer.js'), [
    ['phone:', 'email:'],
    ['phoneVerified:', 'emailVerified:'],
    [/'Phone number is required'/g, "'Email is required'"],
    [/match: \\/\\[6-9\\]\\\\d\\{9\\}\\//g, "match: /^\\\\S+@\\\\S+\\\\.\\\\S+$/"],
    [/'Please enter a valid Indian phone number'/g, "'Please enter a valid email address'"],
]);

replaceInFile(path.join(BE_MODELS_PATH, 'OTP.js'), [
    ['phone:', 'email:'],
    ["enum: \\['phone', 'aadhaar'\\]", "enum: ['email', 'aadhaar']"],
    ["phone: 1,", "email: 1,"],
]);

// 2. Auth Controller
replaceInFile('backend/src/controllers/authController.js', [
    ['{ name, phone, password', '{ name, email, password'],
    ['Elder.findOne({ phone })', 'Elder.findOne({ email })'],
    ["'An account with this phone number already exists'", "'An account with this email already exists'"],
    ['phone,', 'email,'],
    ['Volunteer.findOne({ phone })', 'Volunteer.findOne({ email })'],
    ["'Invalid phone number or password'", "'Invalid email or password'"],
    ['const result = await otpService.sendPhoneOTP(phone);', 'const result = await otpService.sendEmailOTP(email);'],
    ['const result = await otpService.verifyPhoneOTP(phone, otp);', 'const result = await otpService.verifyEmailOTP(email, otp);'],
    ['elder.phoneVerified = true;', 'elder.emailVerified = true;'],
    ['volunteer.phoneVerified = true;', 'volunteer.emailVerified = true;'],
    ['Phone number verified successfully', 'Email verified successfully'],
    ['sendPhoneOTP', 'sendEmailOTP'],
    ['verifyPhoneOTP', 'verifyEmailOTP'],
    ['phone OTP', 'email OTP']
]);

// 3. Auth Routes
replaceInFile('backend/src/routes/authRoutes.js', [
    ['phone:', 'email:'],
    ['phone\\n', 'email\n'],
    ['- phone', '- email'],
    ['9876543210', 'user@example.com'],
    ['9876543212', 'vol@example.com'],
    ['phone OTP', 'email OTP'],
    ['Phone OTP', 'Email OTP']
]);

// 4. Validators
replaceInFile('backend/src/middlewares/validators.js', [
    ["body\\('phone'\\)", "body('email')"],
    ["'Phone number is required'", "'Email address is required'"],
    ["\\.matches\\(/\\^\\[6-9\\]\\\\d\\{9\\}\\$/\\)", ".isEmail()"],
    ["'Please enter a valid 10-digit Indian phone number'", "'Please enter a valid email address'"]
]);

// 5. Frontend Screens
replaceInFile('app/src/screens/LoginScreen.js', [
    ['const \\[phone, setPhone\\] = useState', 'const [email, setEmail] = useState'],
    ['phone\\.trim', 'email.trim'],
    ["!/\\^\\[6-9\\]\\\\d\\{9\\}\\$/.test\\(phone\\.trim\\(\\)\\)", "!/^\\\\S+@\\\\S+\\\\.\\\\S+$/.test(email.trim())"],
    ["'Invalid Phone'", "'Invalid Email'"],
    ["'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"],
    ['your phone number', 'your email address'],
    ['loginFn(phone.trim', 'loginFn(email.trim'],
    ['Phone Number', 'Email Address'],
    ['Enter phone number', 'Enter email address'],
    ['keyboardType="phone-pad"', 'keyboardType="email-address"'],
    ['maxLength={10}', ''],
    ['value={phone}', 'value={email}'],
    ['onChangeText={setPhone}', 'onChangeText={setEmail}'],
    ['<Text style={styles.prefix}>+91</Text>', '']
]);

replaceInFile('app/src/screens/RegisterElderScreen.js', [
    ['const \\[phone, setPhone\\] = useState', 'const [email, setEmail] = useState'],
    ['phone\\.trim', 'email.trim'],
    ["!/\\^\\[6-9\\]\\\\d\\{9\\}\\$/.test\\(phone\\.trim\\(\\)\\)", "!/^\\\\S+@\\\\S+\\\\.\\\\S+$/.test(email.trim())"],
    ["'Invalid Phone'", "'Invalid Email'"],
    ["'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"],
    ['phone: phone.trim', 'email: email.trim'],
    ['Phone Number', 'Email Address'],
    ['Enter phone number', 'Enter email address'],
    ['value={phone}', 'value={email}'],
    ['onChangeText={setPhone}', 'onChangeText={setEmail}'],
    ['keyboardType="phone-pad"', 'keyboardType="email-address" autoCapitalize="none"'],
    ['prefix="+91"', ''],
    ['maxLength={10}', ''],
    ['!name.trim() || !phone.trim() || !password.trim() || !emergencyContactName.trim() || !emergencyContactNumber.trim()', '!name.trim() || !email.trim() || !password.trim() || !emergencyContactName.trim() || !emergencyContactNumber.trim()']
]);

replaceInFile('app/src/screens/RegisterVolunteerScreen.js', [
    ['const \\[phone, setPhone\\] = useState', 'const [email, setEmail] = useState'],
    ['phone\\.trim', 'email.trim'],
    ["!/\\^\\[6-9\\]\\\\d\\{9\\}\\$/.test\\(phone\\.trim\\(\\)\\)", "!/^\\\\S+@\\\\S+\\\\.\\\\S+$/.test(email.trim())"],
    ["'Invalid Phone'", "'Invalid Email'"],
    ["'Please enter a valid 10-digit Indian phone number.'", "'Please enter a valid email address.'"],
    ['phone: phone.trim', 'email: email.trim'],
    ['Phone Number', 'Email Address'],
    ['Enter phone number', 'Enter email address'],
    ['value={phone}', 'value={email}'],
    ['onChangeText={setPhone}', 'onChangeText={setEmail}'],
    ['keyboardType="phone-pad"', 'keyboardType="email-address" autoCapitalize="none"'],
    ['prefix="+91"', ''],
    ['maxLength={10}', ''],
    ['!name.trim() || !phone.trim() || !password.trim() || !aadhaarNumber.trim()', '!name.trim() || !email.trim() || !password.trim() || !aadhaarNumber.trim()']
]);

// 6. Frontend API
replaceInFile('app/src/services/api.js', [
    ['export const loginElder = async (phone, password)', 'export const loginElder = async (email, password)'],
    ['body: JSON.stringify({ phone, password })', 'body: JSON.stringify({ email, password })'],
    ['export const loginVolunteer = async (phone, password)', 'export const loginVolunteer = async (email, password)'],
    ['export const sendOTP = async (phone)', 'export const sendOTP = async (email)'],
    ['body: JSON.stringify({ phone })', 'body: JSON.stringify({ email })'],
    ['export const verifyOTP = async (phone, otp)', 'export const verifyOTP = async (email, otp)'],
    ['body: JSON.stringify({ phone, otp })', 'body: JSON.stringify({ email, otp })']
]);

// 7. ProfileScreen
replaceInFile('app/src/screens/ProfileScreen.js', [
    ['label="Phone Number"', 'label="Email Address"'],
    ['`+91 ${user?.phone || \'\'}`', 'user?.email || \'\'']
]);

console.log("All replacements done.");
