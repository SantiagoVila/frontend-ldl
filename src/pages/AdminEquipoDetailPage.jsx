import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios'; // Se mantiene por si api.js no está configurado, pero es mejor usar 'api'
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BotonVolver from '../components/ui/BotonVolver';
import api from '../api/api'; // <-- CORRECCIÓN: Import aquí, al principio.

function AdminEquipoDetailPage() {
    const [equipo, setEquipo] = useState(null);
    const [ligas, setLigas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { id: equipoId } = useParams();
    const { token } = useAuth();

    // --- FUNCIÓN PARA CARGAR DATOS ---
    // Carga los detalles del equipo y la lista de ligas disponibles.
    const fetchData = async () => {
        if (!token) {
            setError("Token no disponible. Por favor, inicie sesión.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Hacemos las dos llamadas a la API en paralelo para más eficiencia
            const [equipoRes, ligasRes] = await Promise.all([
                api.get(`/equipos/${equipoId}/perfil-detallado`, { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/ligas', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setEquipo(equipoRes.data);
            setLigas(ligasRes.data);
            setError('');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar los datos del equipo.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- HOOK DE EFECTO ---
    // Llama a fetchData() una vez cuando el componente se monta.
    useEffect(() => {
        fetchData();
    }, [equipoId, token]); // Se vuelve a ejecutar si cambia el ID del equipo o el token

    // --- FUNCIÓN PARA ASIGNAR LIGA ---
    // Se llama cuando el admin cambia la selección en el <select>.
    const handleAsignarLiga = async (e) => {
        const ligaId = e.target.value;
        
        // Si el valor es vacío, significa "Sin Liga"
        const ligaIdParaEnviar = ligaId === "" ? null : ligaId;

        try {
            // CORRECTO: 'await' está dentro de una función 'async'.
            await api.put(`/equipos/${equipoId}/asignar-liga`,
                { liga_id: ligaIdParaEnviar },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Liga actualizada con éxito.');
            // Actualizamos los datos para reflejar el cambio.
            fetchData(); 
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al asignar la liga.');
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;
    if (!equipo) return <p className="text-center p-8">No se encontró el equipo.</p>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <BotonVolver />

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
                    <div className="flex items-center space-x-4">
                        <img className="h-16 w-16 rounded-lg bg-gray-700 p-1" src={equipo.escudo || 'https://placehold.co/150x150/1f2937/a0aec0?text=Escudo'} alt="Escudo del equipo" />
                        <div>
                            <h2 className="text-3xl font-bold" style={{fontFamily: 'var(--font-heading)'}}>{equipo.nombre}</h2>
                            <p className="text-sm text-gray-300">ID del Equipo: {equipo.id}</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-700">
                    <dl>
                        <div className="bg-gray-900/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Director Técnico</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{equipo.nombre_dt || 'Sin asignar'}</dd>
                        </div>
                        <div className="bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Formación Base</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{equipo.formacion}</dd>
                        </div>
                        <div className="bg-gray-900/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Asignar a Liga</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                <select value={equipo.liga_id || ''} onChange={handleAsignarLiga} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm">
                                    <option value="">-- Sin Liga --</option>
                                    {ligas.map(liga => (
                                        <option key={liga.id} value={liga.id}>{liga.nombre}</option>
                                    ))}
                                </select>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Plantilla del Equipo</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Jugador</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Posición</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">N°</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                            {equipo.plantilla && equipo.plantilla.length > 0 ? equipo.plantilla.map(jugador => (
                                <tr key={jugador.id} className="hover:bg-gray-800/50">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                                        <Link to={`/admin/usuarios/${jugador.id}`} className="hover:text-cyan-400">
                                            {jugador.nombre_in_game}
                                            {jugador.rol === 'dt' && <span className="ml-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">DT</span>}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{jugador.posicion}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{jugador.numero_remera || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-8 text-sm text-gray-500">
                                        Este equipo aún no tiene jugadores en su plantilla.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminEquipoDetailPage;
