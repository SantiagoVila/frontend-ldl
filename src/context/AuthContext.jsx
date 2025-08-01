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
    
    // Este useEffect es vital para cuando el usuario ya tiene una sesión y refresca la página
    useEffect(() => {
        if (token && !usuario) {
            refreshUserData();
        }

        // Función de limpieza para desconectar el socket al desmontar el componente
        return () => {
            if (socket.connected) {
                socket.disconnect();
            }
        };
    }, [token, usuario]);

    // Este useEffect maneja los eventos del socket una vez que hay conexión
    useEffect(() => {
        if (socket.connected) {
            socket.on('nueva_notificacion', (nuevaNotificacion) => {
                setNotificaciones(notificacionesActuales => [nuevaNotificacion, ...notificacionesActuales]);
                toast.info(`🔔 ${nuevaNotificacion.contenido}`);
            });

            socket.on('equipo_actualizado', (data) => {
                toast.info(`Tu equipo ha sido ${data.status}. Actualizando tu dashboard...`);
                refreshUserData(); // Forzamos la actualización de los datos del usuario
            });

            // Función de limpieza para los listeners del socket
            return () => {
                socket.off('nueva_notificacion');
                socket.off('equipo_actualizado');
            };
        }
    }, [socket.connected]);

    // ✅ FUNCIÓN DE LOGIN CORREGIDA Y CENTRALIZADA
    const login = async (email, password) => {
        // 1. Obtenemos el token del backend
        const response = await api.post('/auth/login', { email, password });
        const tokenRecibido = response.data.token;

        // 2. Guardamos el token en localStorage para persistencia
        localStorage.setItem('token', tokenRecibido);

        // 3. Obtenemos los datos completos del usuario inmediatamente después
        try {
            const decodedUser = jwtDecode(tokenRecibido);
            const userResponse = await api.get(`/usuarios/${decodedUser.id}`, {
                headers: { Authorization: `Bearer ${tokenRecibido}` }
            });
            const usuarioCompleto = { ...decodedUser, ...userResponse.data };
            
            // 4. Actualizamos AMBOS estados. React puede agrupar estas actualizaciones
            setUsuario(usuarioCompleto);
            setToken(tokenRecibido); // Actualizar el token dispara el useEffect de arriba si es necesario

            // 5. Conectamos el socket ahora que tenemos garantía de que el usuario existe
            if (!socket.connected) {
                socket.connect();
                socket.emit('register', usuarioCompleto.id);
            }

        } catch (error) {
            // Si falla la obtención de datos del usuario, limpiamos todo y notificamos
            console.error("Error al obtener datos del usuario tras el login", error);
            logout(); // Usamos tu función de logout para limpiar el estado y localStorage
            // Relanzamos el error para que el componente LoginPage pueda mostrar un toast
            throw new Error("No se pudieron cargar los datos del usuario."); 
        }
    };

    const value = { token, usuario, notificaciones, setNotificaciones, login, logout, refreshUserData };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}