import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminPartidosPage() {
    const [partidos, setPartidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchPartidosParaRevision = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get('/partidos/admin/revision', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPartidos(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar los partidos.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartidosParaRevision();
    }, [token]);

    const handleResolver = async (partidoId, reporteId) => {
        try {
            await api.post(
                `/partidos/admin/resolver/${partidoId}`,
                { reporte_ganador_id: reporteId }, // ✅ CORRECTO: snake_case para el backend
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('¡Partido resuelto con éxito!');
            fetchPartidosParaRevision();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al resolver la disputa.');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'en_disputa': return 'bg-red-500/10 text-red-400';
            case 'reportado_parcialmente': return 'bg-yellow-500/10 text-yellow-400';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando partidos para revisión...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Confirmar Resultados
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    Confirma el resultado correcto para los partidos con reportes conflictivos o pendientes.
                </p>
            </div>

            {partidos.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400">No hay partidos que requieran tu atención en este momento.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {partidos.map(partido => (
                        <div
                            key={partido.id}
                            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {partido.nombre_local} vs {partido.nombre_visitante}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Fecha: {partido.fecha ? new Date(partido.fecha).toLocaleDateString() : 'No definida'}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(partido.estado_reporte)}`}
                                >
                                    {partido.estado_reporte.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {partido.reportes.map(reporte => (
                                    <div
                                        key={reporte.id}
                                        className="bg-gray-900/50 p-4 rounded-md border border-gray-700 flex flex-col"
                                    >
                                        <p className="text-sm text-gray-400">
                                            Reporte del Equipo ID: {reporte.equipo_reportador_id}
                                        </p>
                                        <p className="text-2xl font-bold text-white my-2">
                                            {reporte.goles_local_reportados} - {reporte.goles_visitante_reportados}
                                        </p>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL}${reporte.imagen_prueba_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 underline text-sm mb-4"
                                        >
                                            Ver Prueba
                                        </a>
                                        <button
                                            onClick={() => handleResolver(partido.id, reporte.id)}
                                            className="mt-auto w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                                        >
                                            Dar por Válido este Reporte
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminPartidosPage;
