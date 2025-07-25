import { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function AdminFinTemporadaPage() {
    const [ligas, setLigas] = useState([]);
    const [seleccion, setSeleccion] = useState({
        liga_superior_id: '',
        liga_inferior_id: '',
        cantidad_equipos: '2'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        const fetchLigas = async () => {
            if (!token) return;
            try {
                const response = await api.get('/ligas?estado_temporada=archivada', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLigas(response.data);
            } catch (err) {
                setError('No se pudieron cargar las ligas finalizadas.');
            } finally {
                setLoading(false);
            }
        };
        fetchLigas();
    }, [token]);

    const handleChange = (e) => {
        setSeleccion({ ...seleccion, [e.target.name]: e.target.value });
    };

    const ligasSuperioresPosibles = useMemo(() => {
        return ligas.filter(liga => liga.estado_temporada === 'archivada' && liga.categoria !== 'inferior');
    }, [ligas]);

    const ligasInferioresPosibles = useMemo(() => {
        return ligas.filter(liga => liga.estado_temporada === 'archivada' && liga.categoria !== 'superior');
    }, [ligas]);

    const handleEjecutar = async (e) => {
        e.preventDefault();
        if (!seleccion.liga_superior_id || !seleccion.liga_inferior_id) {
            toast.error('Por favor, selecciona ambas ligas.');
            return;
        }
        if (seleccion.liga_superior_id === seleccion.liga_inferior_id) {
            toast.error('Las ligas superior e inferior no pueden ser la misma.');
            return;
        }

        try {
            const response = await api.post('/admin/promocion-descenso', seleccion, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.message);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Ocurrió un error al procesar la operación.');
        }
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando ligas finalizadas...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Fin de Temporada</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Gestiona los ascensos y descensos entre las ligas finalizadas.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6">
                <form onSubmit={handleEjecutar} className="space-y-6">
                    <div>
                        <label htmlFor="liga_superior_id" className={labelClass}>Liga Superior (de donde descienden)</label>
                        <select id="liga_superior_id" name="liga_superior_id" value={seleccion.liga_superior_id} onChange={handleChange} required className={inputClass}>
                            <option value="">-- Seleccionar Liga --</option>
                            {ligasSuperioresPosibles.map(liga => <option key={liga.id} value={liga.id}>{liga.nombre} (Cat. {liga.categoria})</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="liga_inferior_id" className={labelClass}>Liga Inferior (de donde ascienden)</label>
                        <select id="liga_inferior_id" name="liga_inferior_id" value={seleccion.liga_inferior_id} onChange={handleChange} required className={inputClass}>
                            <option value="">-- Seleccionar Liga --</option>
                            {ligasInferioresPosibles.map(liga => <option key={liga.id} value={liga.id}>{liga.nombre} (Cat. {liga.categoria})</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="cantidad_equipos" className={labelClass}>Cantidad de equipos a mover</label>
                        <select id="cantidad_equipos" name="cantidad_equipos" value={seleccion.cantidad_equipos} onChange={handleChange} className={inputClass}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>

                    <div className="text-right pt-4">
                        <button type="submit" className={buttonClass}>
                            Ejecutar Ascensos y Descensos
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminFinTemporadaPage;
