/**
 * Auth Context — global authentication state
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@sos_token';
const USER_KEY = '@sos_user';
const ROLE_KEY = '@sos_role';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [role, setRole] = useState(null); // 'elder' or 'volunteer'
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const [storedToken, storedUser, storedRole] = await Promise.all([
                AsyncStorage.getItem(TOKEN_KEY),
                AsyncStorage.getItem(USER_KEY),
                AsyncStorage.getItem(ROLE_KEY),
            ]);

            if (storedToken && storedUser && storedRole) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                setRole(storedRole);
            }
        } catch (error) {
            console.log('Error loading auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData, authToken, userRole) => {
        try {
            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, authToken),
                AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
                AsyncStorage.setItem(ROLE_KEY, userRole),
            ]);
            setToken(authToken);
            setUser(userData);
            setRole(userRole);
        } catch (error) {
            console.log('Error saving auth:', error);
        }
    };

    const updateUser = async (userData) => {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.log('Error updating user:', error);
        }
    };

    const logout = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(TOKEN_KEY),
                AsyncStorage.removeItem(USER_KEY),
                AsyncStorage.removeItem(ROLE_KEY),
            ]);
            setToken(null);
            setUser(null);
            setRole(null);
        } catch (error) {
            console.log('Error clearing auth:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role,
                isLoading,
                isAuthenticated: !!token,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
