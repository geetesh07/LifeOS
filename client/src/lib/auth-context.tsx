import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SelectUser, InsertUser } from '@shared/schema';
import { apiRequest, queryClient } from './queryClient';
import { useToast } from '@/hooks/use-toast';

type User = SelectUser;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: Pick<InsertUser, 'username' | 'password'>) => Promise<void>;
    register: (credentials: InsertUser) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Check for active session
        const checkUser = async () => {
            try {
                const res = await fetch('/api/user');
                if (res.ok) {
                    const user = await res.json();
                    setUser(user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const login = async (credentials: Pick<InsertUser, 'username' | 'password'>) => {
        const res = await apiRequest('POST', '/api/login', credentials);
        const user = await res.json();
        setUser(user);
        toast({ title: "Welcome back!" });
    };

    const register = async (credentials: InsertUser) => {
        const res = await apiRequest('POST', '/api/register', credentials);
        const user = await res.json();
        setUser(user);
        toast({ title: "Account created successfully" });
    };

    const logout = async () => {
        await apiRequest('POST', '/api/logout');
        setUser(null);
        queryClient.clear();
        toast({ title: "Logged out successfully" });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
