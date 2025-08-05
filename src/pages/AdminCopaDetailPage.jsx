import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BotonVolver from '../components/ui/BotonVolver';
import BracketCopa from '../components/admin/BracketCopa';

// Componente para mostrar la tabla de posiciones de un grupo
const TablaPosicionesGrupo = ({ tabla }) => (
    <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Equipo</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase">Pts</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase">PJ</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase">G-E-P</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase">DG</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {tabla.map(equipo => (
                    <tr key={equipo.equipo_id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{equipo.equipo_nombre}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-cyan-400 font-bold">{equipo.puntos}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-300">{equipo.partidos_jugados}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-300">{`${equipo.partidos_ganados}-${equipo.partidos_empatados}-${equipo.partidos_perdidos}`}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-300">{equipo.diferencia_goles}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Componente para listar los partidos de un grupo
const PartidosGrupo = ({ partidos, onConfirmar }) => (
    <div>
        <h4 className="text-md font-semibold text-white mb-2">Partidos del Grupo</h4>
        <div className="space-y-2">
            {partidos.map(partido => (
                <div key={partido.id} className="bg-gray-900/50 p-2 rounded-md text-sm flex items-center justify-between">
                    <span className="w-2/5 text-right">{partido.nombre_local}</span>
                    <span className="font-bold mx-2">
                        {partido.goles_local != null ? `${partido.goles_local} - ${partido.goles_visitante}` : 'VS'}
                    </span>
                    <span className="w-2/5 text-left">{partido.nombre_visitante}</span>
                    {partido.estado === 'pendiente' && partido.goles_local != null && (
                        <button onClick={() => onConfirmar(partido)} className="bg-cyan-600 text-white text-xs px-2 py-1 rounded hover:bg-cyan-500" title="Confirmar resultado">
                            ✓
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);


function AdminCopaDetailPage() {
    const [copa, setCopa] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: copaId } = useParams();
    const { token } = useAuth();
    const [jornadasPorDia, setJornadasPorDia] = useState(1); // Nuevo estado para jornadas por día

    const fetchCopaDetalle = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await api.get(`/copas/${copaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCopa(response.data);
        } catch (err) {
            toast.error('No se pudo cargar la información de la copa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCopaDetalle();
    }, [copaId, token]);

    const handleAvanzarFase = async () => {
        if (!window.confirm("¿Estás seguro de que quieres finalizar la fase de grupos y generar las llaves? Esta acción es irreversible.")) return;
        
        try {
            await api.post(`/copas/${copaId}/avanzar-fase`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("¡Fase de grupos finalizada! Generando llaves...");
            fetchCopaDetalle(); // Recargamos la data para ver el bracket
        } catch(err) {
            toast.error(err.response?.data?.error || "Error al avanzar de fase.");
        }
    };

    // Esta función ahora sirve para CUALQUIER partido de copa (grupos o eliminatorias)
    const handleConfirmarPartido = async (partido) => {
        if (!window.confirm(`¿Seguro que quieres aprobar el resultado ${partido.goles_local} - ${partido.goles_visitante}?`)) return;
        
        try {
            await api.put(`/partidos_copa/${partido.id}/confirmar`, 
                { estado: 'aprobado' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Resultado confirmado. ¡La copa se ha actualizado!");
            fetchCopaDetalle();
        } catch(err) {
            toast.error(err.response?.data?.error || "Error al confirmar el resultado.");
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;
    if (!copa) return <p className="text-center p-8">No se encontró la copa.</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BotonVolver />
            
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{copa.nombre}</h2>
                        <p className="mt-1 text-sm text-gray-300">Temporada: {copa.temporada || 'N/A'}</p>
                    </div>
                    {copa.fase_actual === 'grupos' && (
                        <button 
                            onClick={handleAvanzarFase}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            Finalizar Grupos y Generar Llaves
                        </button>
                    )}
                </div>
            </div>

            {/* RENDERIZADO CONDICIONAL */}
            {copa.fase_actual === 'grupos' && copa.grupos ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Grupo 1</h3>
                        <TablaPosicionesGrupo tabla={copa.grupos['1'].tabla} />
                        <PartidosGrupo partidos={copa.grupos['1'].partidos} onConfirmar={handleConfirmarPartido} />
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Grupo 2</h3>
                        <TablaPosicionesGrupo tabla={copa.grupos['2'].tabla} />
                        <PartidosGrupo partidos={copa.grupos['2'].partidos} onConfirmar={handleConfirmarPartido} />
                    </div>
                </div>
            ) : (
                <BracketCopa fixture={copa.fixture} onConfirmarPartido={handleConfirmarPartido} />
            )}
        </div>
    );
}

export default AdminCopaDetailPage;
