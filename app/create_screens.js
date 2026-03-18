const fs = require('fs');

const files = [
    { path: 'app/(auth)/_layout.js', content: 'import { Stack } from "expo-router";\nexport default function Layout() { return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F6F0" } }} />; }' },
    { path: 'app/(elder)/_layout.js', content: 'import { Stack } from "expo-router";\nexport default function Layout() { return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F6F0" } }} />; }' },
    { path: 'app/(volunteer)/_layout.js', content: 'import { Stack } from "expo-router";\nexport default function Layout() { return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F6F0" } }} />; }' },
    { path: 'app/(actions)/_layout.js', content: 'import { Stack } from "expo-router";\nexport default function Layout() { return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F6F0" } }} />; }' },

    { path: 'app/(auth)/role-select.js', content: 'import Screen from "../../src/screens/RoleSelectScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { navigate: (route) => router.push(`/(auth)/${route.toLowerCase()}`), replace: (route) => router.replace(`/(auth)/${route.toLowerCase()}`) };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(auth)/login.js', content: 'import Screen from "../../src/screens/LoginScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { navigate: (route) => router.push(route === "RegisterElder" ? "/(auth)/register-elder" : "/(auth)/register-volunteer"), goBack: () => router.back() };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(auth)/register-elder.js', content: 'import Screen from "../../src/screens/RegisterElderScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { goBack: () => router.back() };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(auth)/register-volunteer.js', content: 'import Screen from "../../src/screens/RegisterVolunteerScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { goBack: () => router.back() };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(elder)/home.js', content: 'import Screen from "../../src/screens/ElderHomeScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { navigate: (route) => router.push(route === "VolunteerSelection" ? "/(actions)/volunteer-selection" : "/(actions)/profile"), replace: (route) => router.replace(route === "VolunteerSelection" ? "/(actions)/volunteer-selection" : "/(actions)/profile") };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(volunteer)/home.js', content: 'import Screen from "../../src/screens/VolunteerHomeScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { navigate: (route) => router.push("/(actions)/profile") };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(actions)/volunteer-selection.js', content: 'import Screen from "../../src/screens/VolunteerSelectionScreen";\nimport { useRouter } from "expo-router";\nexport default function Route() {\n  const router = useRouter();\n  const navigation = { replace: (route) => router.replace("/(elder)/home") };\n  return <Screen navigation={navigation} />;\n}' },

    { path: 'app/(actions)/profile.js', content: 'import Screen from "../../src/screens/ProfileScreen";\nimport { useRouter, useSegments } from "expo-router";\nimport { useAuth } from "../../src/context/AuthContext";\nexport default function Route() {\n  const router = useRouter();\n  const { role } = useAuth();\n  const navigation = { goBack: () => router.replace(role === "elder" ? "/(elder)/home" : "/(volunteer)/home") };\n  return <Screen navigation={navigation} />;\n}' }
];

files.forEach(f => {
    fs.writeFileSync(f.path, f.content);
});
