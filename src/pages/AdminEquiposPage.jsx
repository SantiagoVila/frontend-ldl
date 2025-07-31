import { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function AdminEquiposPage() {
    const [equipos, setEquipos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [ligas, setLigas] = useState([]);
    const [newTeam, setNewTeam] = useState({ nombre: '', formacion: '4-4-2', liga_id: '' });
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    const fetchEquiposPaginados = async (page) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get(`/equipos?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEquipos(response.data.equipos);
            setCurrentPage(response.data.page);
            setTotalPages(Math.ceil(response.data.total / response.data.limit));
        } catch (err) {
            toast.error('No se pudieron cargar los equipos.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) return;
            await fetchEquiposPaginados(1);
            try {
                const ligasRes = await api.get('/ligas', { headers: { Authorization: `Bearer ${token}` } });
                setLigas(ligasRes.data);
            } catch (err) {
                console.error("Error al cargar las ligas para el formulario", err);
            }
        };
        fetchInitialData();
    }, [token]);

    const handleNextPage = () => {
        if (currentPage < totalPages) fetchEquiposPaginados(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) fetchEquiposPaginados(currentPage - 1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeam(prevState => ({ ...prevState, [name]: value }));
    };

    const handleCrearEquipo = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/equipos', newTeam, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Equipo creado con éxito.');
            setNewTeam({ nombre: '', formacion: '4-4-2', liga_id: '' });
            fetchEquiposPaginados(1);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear el equipo.');
        }
    };

    // ✅ NUEVA FUNCIÓN PARA BORRAR EQUIPO
    const handleBorrarEquipo = async (equipoId, equipoNombre) => {
        if (window.confirm(`¿Estás seguro de que quieres borrar el equipo "${equipoNombre}"? Esta acción no se puede deshacer.`)) {
            try {
                // Llama a la nueva ruta DELETE que crearemos en el backend
                await api.delete(`/equipos/${equipoId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`Equipo "${equipoNombre}" borrado con éxito.`);
                fetchEquiposPaginados(currentPage); // Recargamos la lista
            } catch (err) {
                toast.error(err.response?.data?.error || 'Error al borrar el equipo.');
            }
        }
    };

    // ✅ CLASES DE ESTILO CORREGIDAS PARA EL TEMA OSCURO
    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Gestión de Equipos</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Crea, administra y elimina los equipos de la plataforma.
                    </p>
                </div>
            </div>

            {/* Formulario de Creación con Estilos Corregidos */}
            <div className="mt-8 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg">
                <h3 className="text-lg font-medium leading-6 text-cyan-400">Crear Nuevo Equipo</h3>
                <form onSubmit={handleCrearEquipo} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-4 sm:gap-x-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="nombre" className={labelClass}>Nombre del Equipo</label>
                        <input type="text" id="nombre" name="nombre" value={newTeam.nombre} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="formacion" className={labelClass}>Formación</label>
                        <select id="formacion" name="formacion" value={newTeam.formacion} onChange={handleInputChange} className={inputClass}>
                            <option>4-4-2</option>
                            <option>4-3-3</option>
                            <option>3-5-2</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="liga_id" className={labelClass}>Asignar a Liga</label>
                        <select id="liga_id" name="liga_id" value={newTeam.liga_id} onChange={handleInputChange} className={inputClass}>
                            <option value="">-- Opcional --</option>
                            {ligas.map(liga => <option key={liga.id} value={liga.id}>{liga.nombre}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-4 text-right">
                        <button type="submit" className={buttonClass}>
                            Crear Equipo
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Tabla de Equipos con Botón de Borrar */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Nombre</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Liga</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Estado</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                    {equipos.map(equipo => (
                                        <tr key={equipo.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{equipo.nombre}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{equipo.liga_nombre || 'Sin liga'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${equipo.estado === 'aprobado' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {equipo.estado}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                                                <Link to={`/admin/equipos/${equipo.id}`} className="text-cyan-400 hover:text-cyan-300">Ver Detalles</Link>
                                                {/* ✅ BOTÓN DE BORRAR AÑADIDO */}
                                                <button onClick={() => handleBorrarEquipo(equipo.id, equipo.nombre)} className="text-red-500 hover:text-red-400">Borrar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controles de Paginación */}
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
        </div>
    );
}

export default AdminEquiposPage;
