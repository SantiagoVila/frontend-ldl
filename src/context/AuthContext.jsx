import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const AuthContext = createContext();
const socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [usuario, setUsuario] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuario(null);
        if (socket.connected) socket.disconnect();
    };
    
    const refreshUserData = async () => {
        const tokenGuardado = localStorage.getItem('token');
        if (!tokenGuardado) return;

        try {
            const decodedUser = jwtDecode(tokenGuardado);
            const response = await api.get(`/usuarios/${decodedUser.id}`, {
                headers: { Authorization: `Bearer ${tokenGuardado}` },
                params: { cacheBuster: new Date().getTime() }
            });
            
            const usuarioCompleto = { ...decodedUser, ...response.data };
            setUsuario(usuarioCompleto);
            
            if (!socket.connected) {
                socket.connect();
                socket.emit('register', usuarioCompleto.id);
            }
        } catch (error) {
            console.error("Error al refrescar datos de usuario, cerrando sesión.", error);
            logout();
        }
    };
    
    useEffect(() => {
        if (token) {
            refreshUserData();
        }
        return () => {
            if (socket.connected) socket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        if (socket.connected) {
            socket.on('nueva_notificacion', (nuevaNotificacion) => {
                setNotificaciones(notificacionesActuales => [nuevaNotificacion, ...notificacionesActuales]);
                toast.info(`🔔 ${nuevaNotificacion.contenido}`);
            });

            // ✅ NUEVO LISTENER: Escucha el evento de actualización del equipo
            socket.on('equipo_actualizado', (data) => {
                toast.info(`Tu equipo ha sido ${data.status}. Actualizando tu dashboard...`);
                // Forzamos la actualización de los datos del usuario para obtener el nuevo equipo_id
                refreshUserData();
            });

            return () => {
                socket.off('nueva_notificacion');
                socket.off('equipo_actualizado'); // Limpiamos el listener
            };
        }
    }, [socket.connected]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const tokenRecibido = response.data.token;
        localStorage.setItem('token', tokenRecibido);
        setToken(tokenRecibido); // Esto disparará el useEffect para conectar y refrescar
    };

    const value = { token, usuario, notificaciones, setNotificaciones, login, logout, refreshUserData };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
