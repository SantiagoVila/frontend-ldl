import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminPartidosPage() {
    const [partidos, setPartidos] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // --- FUNCIÓN PARA CARGAR PARTIDOS PENDIENTES DE CONFIRMACIÓN ---
    const fetchPartidosPendientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Buscamos partidos que están pendientes y ya tienen un resultado reportado por un DT
            const response = await api.get('/partidos?estado=pendiente', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filtramos para mostrar solo aquellos que tienen un resultado que confirmar
            const partidosAConfirmar = response.data.filter(p => p.resultado_local !== null && p.resultado_visitante !== null);
            setPartidos(partidosAConfirmar);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar los partidos pendientes.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- HOOK DE EFECTO ---
    useEffect(() => {
        fetchPartidosPendientes();
    }, [token]);

    // --- FUNCIÓN PARA CONFIRMAR EL RESULTADO DE UN PARTIDO ---
    const handleConfirmarResultado = async (partidoId) => {
        try {
            // CORRECTO: 'await' está dentro de una función 'async'
            await api.put(`/partidos/${partidoId}/confirmar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Resultado confirmado y partido finalizado con éxito.');
            // Recargamos la lista para que el partido confirmado desaparezca
            fetchPartidosPendientes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al confirmar el resultado.');
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando partidos pendientes...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Confirmar Resultados</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Revisa y confirma los resultados reportados por los Directores Técnicos.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Partido</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Resultado Reportado</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Prueba (Imagen)</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                            {partidos.length > 0 ? partidos.map(partido => (
                                <tr key={partido.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                        <div className="font-medium text-white">{partido.equipo_local_nombre} vs {partido.equipo_visitante_nombre}</div>
                                        <div className="text-gray-400">Jornada {partido.jornada} - {partido.liga_nombre}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                        <span className="font-bold text-lg">{partido.resultado_local} - {partido.resultado_visitante}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                        {partido.imagen_resultado_url ? (
                                            <a href={`${import.meta.env.VITE_API_URL}${partido.imagen_resultado_url}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                                                Ver Prueba
                                            </a>
                                        ) : 'No adjuntada'}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <button
                                            onClick={() => handleConfirmarResultado(partido.id)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                                        >
                                            Confirmar
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-sm text-gray-500">
                                        No hay resultados pendientes de confirmación.
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

export default AdminPartidosPage;
