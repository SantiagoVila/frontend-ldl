import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const AuthContext = createContext();
// Se inicializa el socket sin auto-conectar
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
            
            // ✅ CAMBIO CLAVE: Añadimos un parámetro que cambia con cada llamada para evitar la caché.
            const response = await api.get(`/usuarios/${decodedUser.id}`, {
                headers: { Authorization: `Bearer ${tokenGuardado}` },
                params: { cacheBuster: new Date().getTime() } // Esto fuerza al navegador a pedir datos nuevos
            });
            
            const usuarioCompleto = { ...decodedUser, ...response.data };
            setUsuario(usuarioCompleto);
            
            // Nos conectamos al socket solo si tenemos un usuario completo
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
        const tokenGuardado = localStorage.getItem('token');
        if (tokenGuardado) {
            refreshUserData();
        }
        // Limpieza al desmontar el componente
        return () => {
            if (socket.connected) {
                socket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        // Solo nos suscribimos a eventos si el socket está conectado
        if (socket.connected) {
            socket.on('nueva_notificacion', (nuevaNotificacion) => {
                setNotificaciones(notificacionesActuales => [nuevaNotificacion, ...notificacionesActuales]);
                toast.info(`🔔 ${nuevaNotificacion.contenido}`);
            });
            return () => {
                socket.off('nueva_notificacion');
            };
        }
    }, [socket.connected]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const tokenRecibido = response.data.token;
        localStorage.setItem('token', tokenRecibido);
        setToken(tokenRecibido);
        await refreshUserData(); // refreshUserData se encargará de conectar el socket
    };

    const value = { token, usuario, notificaciones, setNotificaciones, login, logout, refreshUserData };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
