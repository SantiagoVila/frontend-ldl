import { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function JugadorOfertasPage() {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchOfertas = async () => {
        if (!token) {
            setError("Necesitas iniciar sesión para ver tus ofertas.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(''); // Limpiar errores previos
        try {
            const response = await api.get('/transferencias/mis-ofertas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOfertas(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar las ofertas.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Este hook es esencial para llamar a fetchOfertas cuando el componente se monta
    useEffect(() => {
        fetchOfertas();
    }, [token]); // Se ejecuta al cargar y si el token cambia

    const handleResponder = async (ofertaId, respuesta) => {
        try {
            const response = await api.post(`/transferencias/responder`,
                {
                    transferencia_id: ofertaId,
                    respuesta: respuesta
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(response.data.message);
            fetchOfertas(); // Vuelve a cargar las ofertas para actualizar la lista
        } catch (err) {
            toast.error(err.response?.data?.error || `Error al responder la oferta.`);
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando tus ofertas...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Mis Ofertas de Fichaje</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Acepta o rechaza las ofertas de otros equipos.
                    </p>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Equipo Ofertante</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Fecha de Oferta</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                    {ofertas.length > 0 ? ofertas.map(oferta => (
                                        <tr key={oferta.id} className="hover:bg-gray-800/50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                                                {oferta.nombre_equipo}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{new Date(oferta.fecha_solicitud).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                                <button onClick={() => handleResponder(oferta.id, 'aceptada')} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md shadow-sm">
                                                    Aceptar
                                                </button>
                                                <button onClick={() => handleResponder(oferta.id, 'rechazada')} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md shadow-sm">
                                                    Rechazar
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-8 text-sm text-gray-500">
                                                No tienes ofertas pendientes en este momento.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JugadorOfertasPage;