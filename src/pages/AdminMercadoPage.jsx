import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminMercadoPage() {
    const [mercado, setMercado] = useState({ abierto: false, estado: 'automatico', fecha_inicio: '', fecha_fin: '' });
    const [formFechas, setFormFechas] = useState({ inicio: '', fin: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchEstadoMercado = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get('/mercado/estado'); // Llama a la nueva ruta pública
            setMercado(response.data);
            setFormFechas({
                inicio: response.data.fecha_inicio ? new Date(response.data.fecha_inicio).toISOString().slice(0, 16) : '',
                fin: response.data.fecha_fin ? new Date(response.data.fecha_fin).toISOString().slice(0, 16) : ''
            });
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar el estado del mercado.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstadoMercado();
    }, [token]);

    const handleProgramarMercado = async (e) => {
        e.preventDefault();
        if (!formFechas.inicio || !formFechas.fin) {
            toast.warn('Debes especificar tanto la fecha de inicio como la de fin.');
            return;
        }
        try {
            // Llama a la misma ruta, pero el backend ahora actualiza el 'estado' a 'automatico'
            await api.put('/admin/mercado/programar', {
                fecha_inicio: formFechas.inicio,
                fecha_fin: formFechas.fin
            });
            toast.success('Período de mercado programado con éxito. El modo ahora es automático.');
            fetchEstadoMercado();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al programar las fechas.');
        }
    };

    const handleAbrirCerrarManualmente = async (accion) => {
        // Llama a las nuevas rutas POST
        const endpoint = accion === 'abrir' ? '/admin/mercado/abrir' : '/admin/mercado/cerrar';
        try {
            await api.post(endpoint, {});
            toast.success(`Mercado ${accion === 'abrir' ? 'abierto' : 'cerrado'} manualmente.`);
            fetchEstadoMercado();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cambiar el estado del mercado.');
        }
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando estado del mercado...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Gestión del Mercado</h2>
                    <p className="mt-1 text-sm text-gray-400">Controla los períodos de fichajes de la plataforma.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6">
                    <h3 className="text-lg font-medium text-cyan-400 mb-4">Estado Actual</h3>
                    <div className={`p-4 rounded-md text-center ${mercado.abierto ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <p className="font-bold text-lg">El mercado está: {mercado.abierto ? 'ABIERTO' : 'CERRADO'}</p>
                        <p className="text-xs capitalize">Modo: {mercado.estado.replace('_', ' ')}</p>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                        <p><strong>Período programado:</strong></p>
                        <p>Inicio: {mercado.fecha_inicio ? new Date(mercado.fecha_inicio).toLocaleString() : 'N/A'}</p>
                        <p>Fin: {mercado.fecha_fin ? new Date(mercado.fecha_fin).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div className="mt-6 flex justify-center space-x-4">
                        <button onClick={() => handleAbrirCerrarManualmente('abrir')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50" disabled={mercado.abierto}>
                            Abrir Manualmente
                        </button>
                        <button onClick={() => handleAbrirCerrarManualmente('cerrar')} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm disabled:opacity-50" disabled={!mercado.abierto}>
                            Cerrar Manualmente
                        </button>
                    </div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6">
                    <h3 className="text-lg font-medium text-cyan-400 mb-4">Programar Nuevo Período</h3>
                    <form onSubmit={handleProgramarMercado} className="space-y-4">
                        <div>
                            <label htmlFor="inicio" className={labelClass}>Fecha de Inicio:</label>
                            <input id="inicio" type="datetime-local" value={formFechas.inicio} onChange={e => setFormFechas({ ...formFechas, inicio: e.target.value })} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="fin" className={labelClass}>Fecha de Fin:</label>
                            <input id="fin" type="datetime-local" value={formFechas.fin} onChange={e => setFormFechas({ ...formFechas, fin: e.target.value })} required className={inputClass} />
                        </div>
                        <div className="text-right pt-2">
                            <button type="submit" className={buttonClass}>Guardar Fechas</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminMercadoPage;
