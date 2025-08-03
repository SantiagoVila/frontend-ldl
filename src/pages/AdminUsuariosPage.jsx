import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function AdminUsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { token, usuario: adminUser } = useAuth(); // Obtenemos el usuario admin actual

    const fetchUsuarios = async (page) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get(`/usuarios?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(response.data.usuarios);
            setCurrentPage(response.data.page);
            setTotalPages(Math.ceil(response.data.total / response.data.limit));
        } catch (err) {
            setError('No se pudieron cargar los usuarios.');
            toast.error('No se pudieron cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios(1);
    }, [token]);

    /**
     * ✅ NUEVA FUNCIÓN para manejar el borrado de un usuario
     */
    const handleBorrarUsuario = async (usuarioId, usuarioNombre) => {
        // Prevenimos que un admin se borre a sí mismo
        if (adminUser && adminUser.id === usuarioId) {
            toast.error("No puedes borrar tu propia cuenta de administrador.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres borrar al usuario "${usuarioNombre}"? Esta acción es permanente.`)) {
            return;
        }

        try {
            await api.delete(`/usuarios/${usuarioId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('¡Usuario eliminado con éxito!');
            
            // Recargamos la lista de usuarios para reflejar el cambio.
            // Si estás en la última página y solo queda un usuario, volvemos a la página anterior.
            if (usuarios.length === 1 && currentPage > 1) {
                fetchUsuarios(currentPage - 1);
            } else {
                fetchUsuarios(currentPage);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al borrar el usuario');
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchUsuarios(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchUsuarios(currentPage - 1);
        }
    };

    if (loading) return <div className="text-center p-8">Cargando usuarios...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tabla de Usuarios */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">ID</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Nombre / Email</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Rol</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Equipo</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                        {usuarios.map(usuario => (
                            <tr key={usuario.id} className="hover:bg-gray-800/50">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-400 sm:pl-6">{usuario.id}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                    <div className="font-medium text-white">{usuario.nombre_in_game}</div>
                                    <div className="text-gray-500">{usuario.email}</div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        usuario.rol === 'admin' ? 'bg-red-500/10 text-red-400' :
                                        usuario.rol === 'dt' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-green-500/10 text-green-400'
                                    }`}>
                                        {usuario.rol}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{usuario.equipo_nombre || 'Sin equipo'}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                                    <Link to={`/admin/usuarios/${usuario.id}`} className="text-cyan-400 hover:text-cyan-300">Ver</Link>
                                    {/* ✅ BOTÓN DE BORRAR AÑADIDO */}
                                    <button
                                        onClick={() => handleBorrarUsuario(usuario.id, usuario.nombre_in_game || usuario.email)}
                                        className="ml-4 text-red-500 hover:text-red-400"
                                    >
                                        Borrar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginación */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                >
                    Anterior
                </button>
                <div className="text-sm text-gray-400">
                    Página <span className="font-medium text-white">{currentPage}</span> de <span className="font-medium text-white">{totalPages}</span>
                </div>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}

export default AdminUsuariosPage;
