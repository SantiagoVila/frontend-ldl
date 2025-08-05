import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

// --- Componente de Tarjeta de Estadística Reutilizable ---
const StatCard = ({ label, value, icon, link = null }) => {
    const content = (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 text-center transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-center text-cyan-400 mb-2">{icon}</div>
            <p className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>{value}</p>
            <p className="text-sm font-medium text-gray-400">{label}</p>
        </div>
    );
    return link ? <Link to={link} className="block">{content}</Link> : <div className="block">{content}</div>;
};

function DtDashboard() {
    const [stats, setStats] = useState(null);
    const [solicitudPendiente, setSolicitudPendiente] = useState(null); // ✅ NUEVO ESTADO
    const [loading, setLoading] = useState(true);
    const { usuario, token } = useAuth();

    useEffect(() => {
        const fetchDtData = async () => {
            if (!usuario || !token) {
                setLoading(false);
                return;
            }

            // Si el usuario ya tiene un equipo, cargamos las estadísticas
            if (usuario.equipo_id) {
                try {
                    const response = await api.get('/equipos/dt/dashboard-stats', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setStats(response.data);
                } catch (err) {
                    console.error("Error al cargar las estadísticas del dashboard:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                // Si no tiene equipo, verificamos si hay una solicitud pendiente
                try {
                    const response = await api.get('/equipos/dt/mi-solicitud', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSolicitudPendiente(response.data);
                } catch (err) {
                    // Si da un error 404, significa que no hay solicitud, lo cual es normal
                    if (err.response?.status !== 404) {
                        console.error("Error al verificar solicitud pendiente:", err);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchDtData();
    }, [usuario, token]);

    if (loading) {
        return <p className="text-center p-8 text-gray-400">Cargando tu dashboard...</p>;
    }

    // ✅ LÓGICA DE RENDERIZADO MEJORADA
    // 1. Si el usuario tiene un equipo, muestra el dashboard de estadísticas
    if (usuario && usuario.equipo_id && stats) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="flex justify-center items-center gap-4">
                        {stats.equipoInfo?.escudo && <img src={`${import.meta.env.VITE_API_URL}${stats.equipoInfo.escudo}`} alt="Escudo del equipo" className="h-16 w-16 rounded-full" />}
                        <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>{stats.equipoInfo?.nombre || 'Mi Equipo'}</h2>
                    </div>
                    <p className="mt-1 text-lg text-gray-400">
                        Resumen de tu equipo y próximas acciones.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard label="Jugadores en Plantilla" value={stats.playerCount} icon={<span>👥</span>} link="/dt/mi-equipo" />
                    <StatCard label="Puntos en Liga" value={stats.leaguePosition?.puntos || 0} icon={<span>🏆</span>} />
                    <StatCard label="Partidos Jugados (Liga)" value={stats.leaguePosition?.partidos_jugados || 0} icon={<span>⚔️</span>} />
                </div>
                {stats.nextMatch && (
                    <div className="mt-10 bg-gray-800/50 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Próximo Partido</h3>
                        <div className="flex justify-between items-center">
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{stats.nextMatch.nombre_local}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">VS</p>
                                <p className="text-sm text-gray-400">{new Date(stats.nextMatch.fecha).toLocaleString()}</p>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stats.nextMatch.tipo === 'liga' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {stats.nextMatch.tipo}
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{stats.nextMatch.nombre_visitante}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    // 2. Si tiene una solicitud pendiente, muestra el mensaje de espera
    if (solicitudPendiente) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Solicitud Enviada</h2>
                <p className="mt-2 text-lg text-gray-300">
                    Tu solicitud para crear el equipo "<strong>{solicitudPendiente.nombre}</strong>" está siendo revisada por un administrador.
                </p>
                <p className="mt-4 text-sm text-gray-500">Recibirás una notificación cuando sea aprobada o rechazada.</p>
            </div>
        );
    }

    // 3. Si no tiene ni equipo ni solicitud, muestra el botón para crear uno
    return (
        <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>¡Bienvenido, DT!</h2>
            <p className="mt-2 text-lg text-gray-300">Parece que aún no tienes un equipo.</p>
            <Link to="/dt/crear-equipo" className="mt-6 inline-block bg-cyan-500 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-cyan-400 transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]">
                Crear mi Equipo Ahora
            </Link>
        </div>
    );
}

export default DtDashboard;
