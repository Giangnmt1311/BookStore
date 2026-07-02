import {  createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../firebase/firebase.config";
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import getBaseUrl from "../utils/baseURL";

const AuthContext =  createContext();

export const useAuth = () => {
    return useContext(AuthContext)
}

const googleProvider = new GoogleAuthProvider();

export const AuthProvide = ({children}) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const registerUser = async (email,password) => {
        return await createUserWithEmailAndPassword(auth, email, password);
    }

    const loginUser = async (email, password) => {
        return await signInWithEmailAndPassword(auth, email, password)
    }

    const signInWithGoogle = async () => {
        return await signInWithPopup(auth, googleProvider)
    }

    const logout = () => {
        return signOut(auth)
    }

    const syncCustomerProfile = useCallback(async (user) => {
        if (!user?.email) return;
        try {
            await fetch(`${getBaseUrl()}/api/auth/customers/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    username: user.displayName,
                    firebaseId: user.uid
                })
            });
        } catch (error) {
            console.error('Failed to sync customer profile', error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe =  onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);

            if(user) {
                syncCustomerProfile(user);
            }
        })

        return () => unsubscribe();
    }, [syncCustomerProfile])


    const value = {
        currentUser,
        loading,
        registerUser,
        loginUser,
        signInWithGoogle,
        logout
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
