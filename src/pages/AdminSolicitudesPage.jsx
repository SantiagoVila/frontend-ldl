import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api'; // Usamos la instancia de api configurada

function AdminSolicitudesPage() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    // --- FUNCIÓN PARA CARGAR LAS SOLICITUDES DE ROL ---
    const fetchSolicitudesDeRol = async (page) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get(`/admin/solicitudes?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSolicitudes(response.data.solicitudes);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.currentPage || 1);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar las solicitudes.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- HOOK DE EFECTO ---
    useEffect(() => {
        // Se pasa '1' para que siempre cargue la primera página al entrar
        fetchSolicitudesDeRol(1); 
    }, [token]);

    // --- FUNCIÓN PARA RESPONDER A UNA SOLICITUD ---
    const handleResponder = async (solicitudId, respuesta) => {
        try {
            await api.put(`/admin/solicitudes/${solicitudId}/responder`,
                { respuesta },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Solicitud ${respuesta} con éxito.`);
            // Recargamos la página actual para que la solicitud desaparezca de la lista
            fetchSolicitudesDeRol(currentPage); 
        } catch (err) {
            toast.error(err.response?.data?.error || `Error al responder la solicitud.`);
        }
    };

    // --- FUNCIONES DE PAGINACIÓN ---
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchSolicitudesDeRol(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchSolicitudesDeRol(currentPage - 1);
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando solicitudes...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Aprobación de Roles</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Gestiona las solicitudes de los usuarios para convertirse en DT.
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
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">ID Solicitud</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Usuario</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Rol Solicitado</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Fecha</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                    {solicitudes.length > 0 ? solicitudes.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-800/50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-400 sm:pl-6">{s.id}</td>
                                            
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                <div className="font-medium text-white">{s.nombre_in_game}</div>
                                                <div className="text-gray-400">{s.email_usuario}</div>
                                            </td>
                                            
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500/10 text-purple-400">
                                                    {s.rol_solicitado.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                                {/* ✅ CAMBIO 1: de 'aprobada' a 'aprobado' */}
                                                <button onClick={() => handleResponder(s.id, 'aprobado')} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md shadow-sm">
                                                    Aprobar
                                                </button>
                                                {/* ✅ CAMBIO 2: de 'rechazada' a 'rechazado' */}
                                                <button onClick={() => handleResponder(s.id, 'rechazado')} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md shadow-sm">
                                                    Rechazar
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-sm text-gray-500">
                                                No hay solicitudes de rol pendientes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {solicitudes.length > 0 && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                        Anterior
                    </button>
                    <div className="text-sm text-gray-400">
                        Página <span className="font-medium text-white">{currentPage}</span> de <span className="font-medium text-white">{totalPages}</span>
                    </div>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminSolicitudesPage;
