import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api'; // Usamos la instancia de api configurada
import BotonVolver from '../components/ui/BotonVolver';

function PublicJugadorPage() {
    const [jugador, setJugador] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { id } = useParams();

    useEffect(() => {
        const fetchJugador = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/jugadores/publico/${id}`);
                setJugador(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'No se pudo encontrar al jugador.');
            } finally {
                setLoading(false);
            }
        };

        fetchJugador();
    }, [id]);

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando perfil del jugador...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;
    if (!jugador) return <p className="text-center p-8">No hay datos para mostrar.</p>;

    const avatarUrl = jugador.avatar_url 
        ? `${import.meta.env.VITE_API_URL}${jugador.avatar_url}` 
        : 'https://placehold.co/150x150/1f2937/a0aec0?text=Avatar';

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BotonVolver />
            
            {/* Cabecera del Perfil */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
                    <img 
                        src={avatarUrl}
                        alt={`Avatar de ${jugador.nombre_in_game}`} 
                        className="h-32 w-32 rounded-full object-cover bg-gray-700 p-1 border-2 border-gray-600"
                    />
                    <div className="text-center sm:text-left mt-4 sm:mt-0">
                        <h1 className="text-4xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>{jugador.nombre_in_game}</h1>
                        <p className="mt-1 text-lg text-gray-400">
                            {jugador.posicion} | #{jugador.numero_remera || 'S/N'}
                        </p>
                        <p className="mt-2 text-md text-gray-300">
                            Equipo Actual: {jugador.equipo_actual_id ? (
                                <Link to={`/equipos/${jugador.equipo_actual_id}`} className="font-semibold text-cyan-400 hover:underline">
                                    {jugador.equipo_actual}
                                </Link>
                            ) : 'Agente Libre'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Estadísticas de Carrera */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 text-center">
                    <p className="text-3xl font-bold text-cyan-400" style={{fontFamily: 'var(--font-heading)'}}>{jugador.estadisticas_carrera?.partidos || 0}</p>
                    <p className="text-sm font-medium text-gray-400">Partidos Jugados</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 text-center">
                    <p className="text-3xl font-bold text-cyan-400" style={{fontFamily: 'var(--font-heading)'}}>{jugador.estadisticas_carrera?.goles || 0}</p>
                    <p className="text-sm font-medium text-gray-400">Goles</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 text-center">
                    <p className="text-3xl font-bold text-cyan-400" style={{fontFamily: 'var(--font-heading)'}}>{jugador.estadisticas_carrera?.asistencias || 0}</p>
                    <p className="text-sm font-medium text-gray-400">Asistencias</p>
                </div>
            </div>

            {/* Historial de Clubes */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400 border-b border-gray-600 pb-2" style={{fontFamily: 'var(--font-heading)'}}>Historial de Clubes</h3>
                <ul className="divide-y divide-gray-700">
                    {jugador.historial_clubes && jugador.historial_clubes.length > 0 ? (
                        jugador.historial_clubes.map(club => (
                            <li key={`${club.equipo_id}-${club.fecha_ingreso}`} className="py-3 flex items-center justify-between">
                                <Link to={`/equipos/${club.equipo_id}`} className="text-gray-200 font-medium hover:text-cyan-400">
                                    {club.nombre_equipo}
                                </Link>
                                <span className="text-sm text-gray-400">
                                    {new Date(club.fecha_ingreso).getFullYear()} - {club.fecha_salida ? new Date(club.fecha_salida).getFullYear() : 'Presente'}
                                </span>
                            </li>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Sin historial de clubes registrado.</p>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default PublicJugadorPage;
