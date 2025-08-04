import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';
import BotonVolver from '../components/ui/BotonVolver';
import BracketCopa from '../components/admin/BracketCopa'; // Reutilizamos el mismo bracket

// --- Componentes de Vista (similares a los de la página de admin) ---

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

const PartidosGrupo = ({ partidos }) => (
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
                </div>
            ))}
        </div>
    </div>
);

// --- Componente Principal de la Página ---

function PublicoCopaPage() {
    const [copa, setCopa] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: copaId } = useParams();

    useEffect(() => {
        const fetchCopaDetalle = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/copas/publico/${copaId}/detalles`);
                setCopa(response.data);
            } catch (err) {
                toast.error('No se pudo cargar la información de la copa.');
            } finally {
                setLoading(false);
            }
        };
        fetchCopaDetalle();
    }, [copaId]);

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;
    if (!copa) return <p className="text-center p-8">No se encontró la copa.</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BotonVolver />
            
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8 text-center">
                <h2 className="text-4xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>{copa.nombre}</h2>
                <p className="mt-2 text-lg text-gray-300">Temporada: {copa.temporada || 'N/A'}</p>
            </div>

            {/* RENDERIZADO CONDICIONAL */}
            {copa.fase_actual === 'grupos' && copa.grupos ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Grupo 1</h3>
                        <TablaPosicionesGrupo tabla={copa.grupos['1'].tabla} />
                        <PartidosGrupo partidos={copa.grupos['1'].partidos} />
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Grupo 2</h3>
                        <TablaPosicionesGrupo tabla={copa.grupos['2'].tabla} />
                        <PartidosGrupo partidos={copa.grupos['2'].partidos} />
                    </div>
                </div>
            ) : (
                // En la vista pública no pasamos 'onConfirmarPartido' para que no muestre los botones
                <BracketCopa fixture={copa.fixture} />
            )}
        </div>
    );
}

export default PublicoCopaPage;
