import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminLigasPage() {
    const [ligas, setLigas] = useState([]);
    const [nuevaLiga, setNuevaLiga] = useState({ nombre: '', temporada: '', categoria: '1' });
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    const fetchLigas = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get('/ligas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLigas(response.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cargar las ligas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLigas();
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevaLiga(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCrearLiga = async (e) => {
        e.preventDefault();
        if (!nuevaLiga.nombre) {
            toast.warn('El nombre de la liga es obligatorio.');
            return;
        }
        try {
            const response = await api.post('/ligas', nuevaLiga, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('¡Liga creada con éxito!');
            setLigas([response.data, ...ligas]); 
            setNuevaLiga({ nombre: '', temporada: '', categoria: '1' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear la liga');
        }
    };

    /**
     * ✅ NUEVA FUNCIÓN para manejar el borrado de una liga
     */
    const handleBorrarLiga = async (ligaId, ligaNombre) => {
        if (!window.confirm(`¿Estás seguro de que quieres borrar la liga "${ligaNombre}"? Esta acción es permanente y eliminará todos sus datos.`)) {
            return;
        }
        try {
            await api.delete(`/ligas/${ligaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('¡Liga eliminada con éxito!');
            // Actualiza el estado para quitar la liga de la lista al instante
            setLigas(prevLigas => prevLigas.filter(l => l.id !== ligaId));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al borrar la liga');
        }
    };
    
    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando ligas...</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Gestión de Ligas</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Crea y administra las competiciones de la plataforma.
                    </p>
                </div>
            </div>

            {/* FORMULARIO DE CREACIÓN */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium leading-6 text-cyan-400">Crear Nueva Liga</h3>
                <form onSubmit={handleCrearLiga} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-4 sm:gap-x-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="nombre" className={labelClass}>Nombre de la Liga</label>
                        <input type="text" id="nombre" name="nombre" value={nuevaLiga.nombre} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="temporada" className={labelClass}>Temporada</label>
                        <input type="text" id="temporada" name="temporada" value={nuevaLiga.temporada} onChange={handleInputChange} placeholder="Ej: 2025-26" className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="categoria" className={labelClass}>Categoría</label>
                        <select id="categoria" name="categoria" value={nuevaLiga.categoria} onChange={handleInputChange} className={inputClass}>
                            <option value="1">Categoría 1</option>
                            <option value="2">Categoría 2</option>
                            <option value="3">Categoría 3</option>
                            <option value="4">Categoría 4</option>
                        </select>
                    </div>
                    <div className="sm:col-span-4 text-right">
                        <button type="submit" className={buttonClass}>
                            Crear Liga
                        </button>
                    </div>
                </form>
            </div>
            
            {/* LISTA DE LIGAS EXISTENTES */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-cyan-400">Ligas Existentes</h3>
                </div>
                <div className="border-t border-gray-700">
                    <ul role="list" className="divide-y divide-gray-700">
                        {ligas.length > 0 ? (
                            ligas.map(liga => (
                                <li key={liga.id} className="flex items-center justify-between hover:bg-gray-800">
                                    <Link to={`/admin/ligas/${liga.id}`} className="flex-grow block">
                                        <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${liga.estado_temporada === 'activa' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {liga.estado_temporada || 'inactiva'}
                                                </span>
                                                <p className="ml-4 font-medium text-indigo-400 truncate">{liga.nombre}</p>
                                                <p className="ml-2 text-sm text-gray-400 truncate">({liga.temporada || 'Sin temporada'})</p>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-cyan-500/10 text-cyan-400">
                                                    Cat. {liga.categoria}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    {/* ✅ BOTÓN DE BORRAR AÑADIDO */}
                                    <div className="px-4 flex-shrink-0">
                                        <button
                                            onClick={() => handleBorrarLiga(liga.id, liga.nombre)}
                                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                                            title="Borrar Liga"
                                        >
                                            X
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-4 text-center text-sm text-gray-500">No hay ligas creadas.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminLigasPage;
